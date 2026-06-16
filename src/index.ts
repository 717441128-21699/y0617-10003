import { setConfig, shouldSample } from './config';
import { collectWebVitals } from './collectors/web-vitals';
import { collectResources } from './collectors/resource';
import { collectErrors } from './collectors/error';
import { startReporter, stopReporter } from './reporter';
import { PerfMonitorConfig } from './types';

let started = false;

export function init(options: Partial<PerfMonitorConfig> & { appName: string; reportUrl: string }): void {
  if (started) return;

  setConfig(options);

  if (!shouldSample()) return;

  started = true;

  collectErrors();
  collectWebVitals();
  collectResources();
  startReporter();
}

export function destroy(): void {
  if (!started) return;
  stopReporter();
  started = false;
}

export { setConfig, getConfig } from './config';
export { PerfMonitorConfig, WebVitalMetric, ResourceMetric, ErrorMetric } from './types';
