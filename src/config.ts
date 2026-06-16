import {
  PerfMonitorConfig,
  FilterConfig,
  PipelineConfig,
  Environment,
  Plugin,
  BatchPlugin,
  RetryConfig,
} from './types';

const DEFAULT_FILTERS: FilterConfig = {
  webVitals: true,
  resources: true,
  errors: true,
  custom: true,
};

const DEFAULT_RETRY: RetryConfig = {
  enabled: true,
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

const DEFAULT_CONFIG: PerfMonitorConfig = {
  appName: '',
  reportUrl: '',
  environment: 'production',
  sampleRate: 1,
  reportInterval: 10000,
  filters: DEFAULT_FILTERS,
  debug: false,
  dryRun: false,
};

let currentConfig: PerfMonitorConfig = {
  ...DEFAULT_CONFIG,
  filters: { ...DEFAULT_FILTERS },
};

const plugins: Plugin[] = [];
const batchPlugins: BatchPlugin[] = [];

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
    transport: envPipeline.transport || 'auto',
    customTransport: envPipeline.customTransport,
    retry: envPipeline.retry ? { ...DEFAULT_RETRY, ...envPipeline.retry } : { ...DEFAULT_RETRY },
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

export function setDryRun(dryRun: boolean): void {
  currentConfig.dryRun = dryRun;
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

export function addBatchPlugin(plugin: BatchPlugin): void {
  batchPlugins.push(plugin);
}

export function getBatchPlugins(): BatchPlugin[] {
  return batchPlugins;
}

export function clearBatchPlugins(): void {
  batchPlugins.length = 0;
}
