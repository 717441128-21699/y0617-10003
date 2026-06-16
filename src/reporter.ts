import { getConfig } from './config';
import { getContext, getSession, getStayDuration } from './context';
import { drainMetrics, getBufferSize } from './store';
import { appendPendingPayload, peekFirstPending, shiftFirstPending, getPendingCount, isOnline } from './offline';
import { ReportPayload } from './types';

let timerId: ReturnType<typeof setInterval> | null = null;

function sendOnePayload(payload: ReportPayload): boolean {
  const config = getConfig();
  if (!config.reportUrl) return false;

  const data = JSON.stringify(payload);

  if (isOnline()) {
    const sent = navigator.sendBeacon(config.reportUrl, data);
    if (sent) return true;

    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', config.reportUrl, false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
      return xhr.status >= 200 && xhr.status < 300;
    } catch {
      // XHR also failed
    }
  }

  return false;
}

function sendOrPersist(payload: ReportPayload): void {
  const success = sendOnePayload(payload);
  if (!success) {
    appendPendingPayload(payload);
  }
}

function buildPayload(metrics: ReportPayload['metrics']): ReportPayload {
  const config = getConfig();
  return {
    appName: config.appName,
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
    } else {
      break;
    }
  }
}

function flush(): void {
  if (getBufferSize() === 0) {
    retryPendingPayloads();
    return;
  }

  const metrics = drainMetrics();
  const payload = buildPayload(metrics);

  sendOrPersist(payload);
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
