import { PerfMonitorConfig, FilterConfig } from './types';

const DEFAULT_FILTERS: FilterConfig = {
  webVitals: true,
  resources: true,
  errors: true,
  custom: true,
};

const DEFAULT_CONFIG: PerfMonitorConfig = {
  appName: '',
  reportUrl: '',
  sampleRate: 1,
  reportInterval: 10000,
  filters: DEFAULT_FILTERS,
};

let currentConfig: PerfMonitorConfig = { ...DEFAULT_CONFIG, filters: { ...DEFAULT_FILTERS } };

export function setConfig(partial: Partial<PerfMonitorConfig>): void {
  if (partial.filters) {
    currentConfig.filters = { ...currentConfig.filters, ...partial.filters };
  }
  currentConfig = { ...currentConfig, ...partial, filters: currentConfig.filters };
}

export function getConfig(): PerfMonitorConfig {
  return currentConfig;
}

export function isInitialized(): boolean {
  return currentConfig.appName !== '' && currentConfig.reportUrl !== '';
}

export function shouldSample(): boolean {
  return Math.random() < currentConfig.sampleRate;
}
