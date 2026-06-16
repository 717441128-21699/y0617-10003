import { setConfig, shouldSample } from './config';
import { collectWebVitals } from './collectors/web-vitals';
import { collectResources } from './collectors/resource';
import { collectErrors } from './collectors/error';
import { trackEvent, TrackEventOptions } from './collectors/custom';
import { startReporter, stopReporter } from './reporter';
import { setUser, setRoute, setTags, watchRouteChanges } from './context';
import { PerfMonitorConfig } from './types';

let started = false;

export function init(options: Partial<PerfMonitorConfig> & { appName: string; reportUrl: string }): void {
  if (started) return;

  setConfig(options);

  if (!shouldSample()) return;

  started = true;

  watchRouteChanges();
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
export { setUser, setRoute, setTags } from './context';
export { trackEvent } from './collectors/custom';
export { PerfMonitorConfig, WebVitalMetric, ResourceMetric, ErrorMetric, CustomMetric, ContextInfo, UserInfo } from './types';
export { TrackEventOptions } from './collectors/custom';
