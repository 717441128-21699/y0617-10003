import { PerfMonitorConfig, FilterConfig, PipelineConfig, Environment, Plugin } from './types';

const DEFAULT_FILTERS: FilterConfig = {
  webVitals: true,
  resources: true,
  errors: true,
  custom: true,
};

const DEFAULT_CONFIG: PerfMonitorConfig = {
  appName: '',
  reportUrl: '',
  environment: 'production',
  sampleRate: 1,
  reportInterval: 10000,
  filters: DEFAULT_FILTERS,
  debug: false,
};

let currentConfig: PerfMonitorConfig = {
  ...DEFAULT_CONFIG,
  filters: { ...DEFAULT_FILTERS },
};

const plugins: Plugin[] = [];

export function setConfig(partial: Partial<PerfMonitorConfig>): void {
  if (partial.filters) {
    currentConfig.filters = { ...currentConfig.filters, ...partial.filters };
  }
  if (partial.pipelines) {
    currentConfig.pipelines = { ...currentConfig.pipelines, ...partial.pipelines };
  }
  currentConfig = { ...currentConfig, ...partial, filters: currentConfig.filters };
}

export function getConfig(): PerfMonitorConfig {
  return currentConfig;
}

export function getPipelineConfig(): PipelineConfig {
  const env = currentConfig.environment;
  const envPipeline = currentConfig.pipelines?.[env] || {};
  return {
    reportUrl: envPipeline.reportUrl || currentConfig.reportUrl,
    batchSize: envPipeline.batchSize || 50,
    sendStrategy: envPipeline.sendStrategy || 'auto',
    silent: envPipeline.silent || false,
  };
}

export function isInitialized(): boolean {
  return currentConfig.appName !== '' && currentConfig.reportUrl !== '';
}

export function shouldSample(): boolean {
  return Math.random() < currentConfig.sampleRate;
}

export function setEnvironment(env: Environment): void {
  currentConfig.environment = env;
}

export function setDebug(debug: PerfMonitorConfig['debug']): void {
  currentConfig.debug = debug;
}

export function addPlugin(plugin: Plugin): void {
  plugins.push(plugin);
}

export function getPlugins(): Plugin[] {
  return plugins;
}

export function clearPlugins(): void {
  plugins.length = 0;
}
