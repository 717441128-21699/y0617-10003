import { getConfig, getPipelineConfig } from './config';
import { getContext, getSession, getStayDuration } from './context';
import { getBufferSize, peekMetrics, consumeMetrics } from './store';
import { appendPendingPayload, peekFirstPending, shiftFirstPending, getPendingCount, isOnline } from './offline';
import { applyPluginsToBatch } from './plugin';
import { ReportPayload, MetricPayload } from './types';
import { logDebug } from './debug';

let timerId: ReturnType<typeof setInterval> | null = null;

function sendOnePayload(payload: ReportPayload): boolean {
  const pipeline = getPipelineConfig();
  if (!pipeline.reportUrl) return false;
  if (pipeline.silent) return true;

  const data = JSON.stringify(payload);
  const strategy = pipeline.sendStrategy;

  if (isOnline()) {
    if (strategy === 'beacon' || strategy === 'auto') {
      try {
        const sent = navigator.sendBeacon(pipeline.reportUrl, data);
        if (sent) return true;
      } catch {
        // beacon failed, fall through to XHR
      }
    }

    if (strategy === 'xhr' || strategy === 'auto') {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', pipeline.reportUrl, false);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(data);
        return xhr.status >= 200 && xhr.status < 300;
      } catch {
        // XHR also failed
      }
    }
  }

  return false;
}

function sendOrPersist(payload: ReportPayload): void {
  const success = sendOnePayload(payload);
  if (success) {
    logDebug('sent', null, `batch of ${payload.metrics.length} metrics`);
  } else {
    appendPendingPayload(payload);
    logDebug('queued', null, `batch of ${payload.metrics.length} metrics (offline)`);
  }
}

function buildPayload(metrics: MetricPayload[]): ReportPayload {
  const config = getConfig();
  return {
    appName: config.appName,
    environment: config.environment,
    timestamp: Date.now(),
    session: getSession(),
    context: getContext(),
    stayDuration: getStayDuration(),
    metrics,
  };
}

function retryPendingPayloads(): void {
  const maxRetriesPerCycle = 10;
  let retried = 0;

  while (retried < maxRetriesPerCycle && getPendingCount() > 0 && isOnline()) {
    const payload = peekFirstPending();
    if (!payload) break;

    const success = sendOnePayload(payload);
    if (success) {
      shiftFirstPending();
      retried++;
      logDebug('sent', null, `retry succeeded, ${getPendingCount()} remaining`);
    } else {
      break;
    }
  }
}

function flush(): void {
  const pipeline = getPipelineConfig();
  const batchSize = pipeline.batchSize ?? 50;

  if (getBufferSize() === 0) {
    retryPendingPayloads();
    return;
  }

  let remaining = getBufferSize();
  while (remaining > 0) {
    const count = Math.min(batchSize, remaining);
    const rawMetrics = peekMetrics(count);
    const metrics = applyPluginsToBatch(rawMetrics);

    consumeMetrics(count);

    if (metrics.length === 0) {
      remaining = getBufferSize();
      continue;
    }

    const payload = buildPayload(metrics);
    sendOrPersist(payload);
    remaining = getBufferSize();
  }

  retryPendingPayloads();
}

export function startReporter(): void {
  const config = getConfig();

  if (timerId !== null) {
    clearInterval(timerId);
  }

  retryPendingPayloads();

  timerId = setInterval(flush, config.reportInterval);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });

  window.addEventListener('online', () => {
    retryPendingPayloads();
  });
}

export function stopReporter(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  flush();
}
