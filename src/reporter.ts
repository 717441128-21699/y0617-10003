import { getConfig } from './config';
import { getContext } from './context';
import { drainMetrics, getBufferSize } from './store';
import { savePendingPayload, drainPendingPayloads, isOnline } from './offline';
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

function send(payload: ReportPayload): void {
  const success = sendOnePayload(payload);
  if (!success) {
    savePendingPayload(payload);
  }
}

function retryPendingPayloads(): void {
  const pending = drainPendingPayloads();
  for (const payload of pending) {
    if (!sendOnePayload(payload)) {
      savePendingPayload(payload);
      break;
    }
  }
}

function flush(): void {
  if (getBufferSize() === 0) {
    retryPendingPayloads();
    return;
  }

  const config = getConfig();
  const metrics = drainMetrics();

  const payload: ReportPayload = {
    appName: config.appName,
    timestamp: Date.now(),
    context: getContext(),
    metrics,
  };

  send(payload);
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
