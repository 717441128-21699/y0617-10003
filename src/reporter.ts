import { getConfig } from './config';
import { drainMetrics, getBufferSize } from './store';
import { ReportPayload } from './types';

let timerId: ReturnType<typeof setInterval> | null = null;

function send(payload: ReportPayload): void {
  const config = getConfig();
  if (!config.reportUrl) return;

  const data = JSON.stringify(payload);
  const sent = navigator.sendBeacon(config.reportUrl, data);

  if (!sent) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', config.reportUrl, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(data);
    } catch {
      // silently fail
    }
  }
}

function flush(): void {
  if (getBufferSize() === 0) return;

  const config = getConfig();
  const metrics = drainMetrics();

  const payload: ReportPayload = {
    appName: config.appName,
    timestamp: Date.now(),
    metrics,
  };

  send(payload);
}

export function startReporter(): void {
  const config = getConfig();

  if (timerId !== null) {
    clearInterval(timerId);
  }

  timerId = setInterval(flush, config.reportInterval);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flush();
    }
  });
}

export function stopReporter(): void {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
  flush();
}
