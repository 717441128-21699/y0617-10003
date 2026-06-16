import { getConfig, getPipelineConfig } from './config';
import { getContext, getSession, getStayDuration } from './context';
import { getBufferSize, peekMetrics, consumeMetrics } from './store';
import { appendPendingPayload, peekFirstPending, shiftFirstPending, getPendingCount, isOnline } from './offline';
import { applyPluginsToBatch, applyBatchPlugins } from './plugin';
import { ReportPayload, MetricPayload, RetryConfig, TransportType } from './types';
import { logDebug } from './debug';

let timerId: ReturnType<typeof setInterval> | null = null;

function calculateBackoff(retry: number, retryConfig: RetryConfig): number {
  const base = retryConfig.baseDelayMs ?? 500;
  const multiplier = retryConfig.backoffMultiplier ?? 2;
  const maxDelay = retryConfig.maxDelayMs ?? 10000;
  let delay = base * Math.pow(multiplier, Math.max(0, retry - 1));

  if (retryConfig.jitter) {
    delay = delay * (0.5 + Math.random() * 0.5);
  }

  return Math.min(delay, maxDelay);
}

function sleepSync(ms: number): void {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // busy wait for synchronous retry backoff
  }
}

function sendViaBeacon(payload: ReportPayload, url: string): boolean {
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    return navigator.sendBeacon(url, blob);
  } catch {
    return false;
  }
}

function sendViaXHR(payload: ReportPayload, url: string): boolean {
  try {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(payload));
    return xhr.status >= 200 && xhr.status < 300;
  } catch {
    return false;
  }
}

function sendViaFetch(payload: ReportPayload, url: string): boolean {
  if (typeof fetch === 'undefined') return false;
  try {
    let success = false;
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then((res) => {
        success = res.ok;
      })
      .catch(() => undefined);
    return success;
  } catch {
    return false;
  }
}

function sendViaImage(payload: ReportPayload, url: string): boolean {
  try {
    const img = new Image();
    const encoded = encodeURIComponent(JSON.stringify(payload));
    img.src = `${url}?data=${encoded}&t=${Date.now()}`;
    return true;
  } catch {
    return false;
  }
}

async function sendViaCustom(
  payload: ReportPayload,
  url: string,
  fn: (p: ReportPayload, u: string) => boolean | Promise<boolean>,
): Promise<boolean> {
  try {
    const result = await fn(payload, url);
    return result === true;
  } catch {
    return false;
  }
}

interface TransportResult {
  success: boolean;
  transportUsed: TransportType;
  attempts: number;
}

async function tryTransports(
  payload: ReportPayload,
  url: string,
  requestedTransport: TransportType,
  customFn: ((p: ReportPayload, u: string) => boolean | Promise<boolean>) | undefined,
  retryConfig: RetryConfig,
): Promise<TransportResult> {
  const transports: TransportType[] = [];
  let firstFailedTransport: TransportType | null = null;
  let attempts = 0;

  switch (requestedTransport) {
    case 'auto':
      transports.push('beacon', 'fetch', 'xhr');
      break;
    case 'custom':
      if (customFn) {
        transports.push('custom');
      }
      transports.push('beacon', 'fetch', 'xhr');
      break;
    default:
      transports.push(requestedTransport);
  }

  for (const transport of transports) {
    attempts++;
    let success = false;
    let retryCount = 0;
    const maxRetries = (retryConfig.enabled !== false ? retryConfig.maxRetries : 0) ?? 0;

    do {
      if (retryCount > 0) {
        const delay = calculateBackoff(retryCount, retryConfig);
        logDebug('retry', null, `delay ${Math.round(delay)}ms`, { transport, retryCount });
        sleepSync(delay);
      }

      logDebug('transport', null, `attempt #${retryCount + 1}`, { transport });

      switch (transport) {
        case 'beacon':
          success = sendViaBeacon(payload, url);
          break;
        case 'fetch':
          success = sendViaFetch(payload, url);
          break;
        case 'xhr':
          success = sendViaXHR(payload, url);
          break;
        case 'image':
          success = sendViaImage(payload, url);
          break;
        case 'custom':
          if (customFn) {
            success = await sendViaCustom(payload, url, customFn);
          }
          break;
      }

      if (success) {
        return { success: true, transportUsed: transport, attempts: attempts };
      }

      if (!firstFailedTransport) {
        firstFailedTransport = transport;
      }

      retryCount++;
    } while (retryCount <= maxRetries);
  }

  return { success: false, transportUsed: firstFailedTransport || requestedTransport, attempts };
}

async function sendOnePayload(payload: ReportPayload): Promise<TransportResult> {
  const pipeline = getPipelineConfig();
  const config = getConfig();

  if (!pipeline.reportUrl) {
    return { success: false, transportUsed: 'auto', attempts: 0 };
  }

  if (pipeline.silent) {
    return { success: true, transportUsed: 'auto', attempts: 0 };
  }

  if (config.dryRun) {
    logDebug('dryrun', null, `${payload.metrics.length} metrics (${pipeline.transport})`, {
      transport: pipeline.transport,
      payload,
    });
    return { success: true, transportUsed: pipeline.transport || 'auto', attempts: 0 };
  }

  if (!isOnline()) {
    return { success: false, transportUsed: pipeline.transport || 'auto', attempts: 0 };
  }

  return tryTransports(
    payload,
    pipeline.reportUrl,
    pipeline.transport || 'auto',
    pipeline.customTransport,
    pipeline.retry || { enabled: true, maxRetries: 3, baseDelayMs: 500, maxDelayMs: 10000, backoffMultiplier: 2, jitter: true },
  );
}

async function sendOrPersist(payload: ReportPayload): Promise<void> {
  const result = await sendOnePayload(payload);
  if (result.success) {
    logDebug('sent', null, `batch of ${payload.metrics.length} metrics (attempts: ${result.attempts})`, {
      transport: result.transportUsed,
    });
  } else {
    appendPendingPayload(payload);
    logDebug('queued', null, `batch of ${payload.metrics.length} metrics (offline/transport failed: ${result.transportUsed})`);
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

async function retryPendingPayloads(): Promise<void> {
  const maxRetriesPerCycle = 10;
  let retried = 0;

  while (retried < maxRetriesPerCycle && getPendingCount() > 0 && isOnline()) {
    const payload = peekFirstPending();
    if (!payload) break;

    const result = await sendOnePayload(payload);
    if (result.success) {
      shiftFirstPending();
      retried++;
      logDebug('sent', null, `retry succeeded (${getPendingCount()} remaining)`, {
        transport: result.transportUsed,
      });
    } else {
      break;
    }
  }
}

async function flush(): Promise<void> {
  const pipeline = getPipelineConfig();
  const batchSize = pipeline.batchSize ?? 50;

  if (getBufferSize() === 0) {
    await retryPendingPayloads();
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

    let payload = buildPayload(metrics);
    const afterBatchPlugins = applyBatchPlugins(payload);

    if (afterBatchPlugins === null) {
      logDebug('dropped', null, 'batch dropped by batch plugin');
      remaining = getBufferSize();
      continue;
    }
    payload = afterBatchPlugins;

    await sendOrPersist(payload);
    remaining = getBufferSize();
  }

  await retryPendingPayloads();
}

export function startReporter(): void {
  const config = getConfig();

  if (timerId !== null) {
    clearInterval(timerId);
  }

  retryPendingPayloads();

  timerId = setInterval(() => {
    flush();
  }, config.reportInterval);

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
