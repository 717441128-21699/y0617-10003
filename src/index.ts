import {
  setConfig,
  shouldSample,
  setEnvironment,
  setDebug,
  addPlugin,
  clearPlugins,
  getConfig,
} from './config';
import { initSession, setUser, setRoute, setTags, watchRouteChanges } from './context';
import { collectWebVitals } from './collectors/web-vitals';
import { collectResources } from './collectors/resource';
import { collectErrors } from './collectors/error';
import { trackEvent, TrackEventOptions } from './collectors/custom';
import { startReporter, stopReporter } from './reporter';
import { getDebugLog, clearDebugLog } from './debug';
import {
  PerfMonitorConfig,
  FilterConfig,
  StackProcessor,
  PipelineConfig,
  PipelineConfigs,
  Plugin,
  DebugMode,
  Environment,
  ErrorSampleRule,
  WebVitalMetric,
  ResourceMetric,
  ErrorMetric,
  CustomMetric,
  ContextInfo,
  UserInfo,
  SessionInfo,
  ReportPayload,
  MetricPayload,
  WebVitalsFilter,
  ResourceFilter,
  ErrorFilter,
  CustomFilter,
} from './types';

let started = false;

export function init(
  options: Partial<PerfMonitorConfig> & { appName: string; reportUrl: string },
): void {
  if (started) return;

  setConfig(options);

  if (!shouldSample()) return;

  started = true;

  initSession();
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

export { setConfig, getConfig, setEnvironment, setDebug, addPlugin, clearPlugins };
export { setUser, setRoute, setTags };
export { trackEvent };
export { getDebugLog, clearDebugLog };
export {
  PerfMonitorConfig,
  FilterConfig,
  StackProcessor,
  PipelineConfig,
  PipelineConfigs,
  Plugin,
  DebugMode,
  Environment,
  ErrorSampleRule,
  WebVitalMetric,
  ResourceMetric,
  ErrorMetric,
  CustomMetric,
  ContextInfo,
  UserInfo,
  SessionInfo,
  ReportPayload,
  MetricPayload,
  WebVitalsFilter,
  ResourceFilter,
  ErrorFilter,
  CustomFilter,
};
export { TrackEventOptions };
