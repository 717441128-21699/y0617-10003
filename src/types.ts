export type Environment = 'development' | 'testing' | 'staging' | 'production' | string;

export interface SessionInfo {
  sessionId: string;
  startTime: number;
}

export interface UserInfo {
  userId?: string;
  [key: string]: unknown;
}

export interface ContextInfo {
  user: UserInfo;
  route: string;
  tags: Record<string, string>;
}

export type MetricType = 'web-vitals' | 'resource' | 'error' | 'custom';

export interface WebVitalsFilter {
  sampleRate?: number;
  exclude?: ('LCP' | 'FID' | 'CLS')[];
}

export interface ResourceFilter {
  sampleRate?: number;
  include?: string[];
  exclude?: string[];
  initiatorTypes?: string[];
}

export interface ErrorSampleRule {
  pattern: string;
  sampleRate: number;
}

export interface ErrorTypeSampleConfig {
  sampleRate?: number;
  excludeMessages?: string[];
  sampleRules?: ErrorSampleRule[];
}

export interface ErrorFilter {
  sampleRate?: number;
  excludeTypes?: ('js-error' | 'promise-rejection')[];
  excludeMessages?: string[];
  sampleRules?: ErrorSampleRule[];
  byType?: {
    'js-error'?: ErrorTypeSampleConfig;
    'promise-rejection'?: ErrorTypeSampleConfig;
  };
}

export interface CustomFilter {
  sampleRate?: number;
  excludeNames?: string[];
}

export interface FilterConfig {
  webVitals?: WebVitalsFilter | boolean;
  resources?: ResourceFilter | boolean;
  errors?: ErrorFilter | boolean;
  custom?: CustomFilter | boolean;
}

export type StackProcessor = (stack: string, error: Error | null) => string;

export type DebugMode = boolean | 'silent';

export type TransportType = 'beacon' | 'fetch' | 'xhr' | 'image' | 'custom' | 'auto';

export interface RetryConfig {
  enabled?: boolean;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
}

export type CustomTransport = (payload: ReportPayload, url: string) => boolean | Promise<boolean>;

export interface PipelineConfig {
  reportUrl?: string;
  batchSize?: number;
  transport?: TransportType;
  customTransport?: CustomTransport;
  retry?: RetryConfig;
  silent?: boolean;
}

export interface PipelineConfigs {
  development?: PipelineConfig;
  testing?: PipelineConfig;
  staging?: PipelineConfig;
  production?: PipelineConfig;
  [env: string]: PipelineConfig | undefined;
}

export type Plugin = (metric: MetricPayload) => MetricPayload | null | undefined | void;

export type BatchPlugin = (payload: ReportPayload) => ReportPayload | null | undefined | void;

export interface PerfMonitorConfig {
  appName: string;
  reportUrl: string;
  environment: Environment;
  pipelines?: PipelineConfigs;
  sampleRate: number;
  reportInterval: number;
  filters: FilterConfig;
  stackProcessor?: StackProcessor;
  debug: DebugMode;
  dryRun: boolean;
}

export interface WebVitalMetric {
  type: 'LCP' | 'FID' | 'CLS';
  value: number;
  timestamp: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  route: string;
}

export interface ResourceMetric {
  name: string;
  initiatorType: string;
  duration: number;
  transferSize: number;
  startTime: number;
  protocol: string;
  route: string;
}

export interface ErrorMetric {
  type: 'js-error' | 'promise-rejection';
  message: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
  timestamp: number;
  route: string;
}

export interface CustomMetric {
  type: 'custom';
  name: string;
  duration?: number;
  extra?: Record<string, unknown>;
  timestamp: number;
  route: string;
}

export type MetricPayload = WebVitalMetric | ResourceMetric | ErrorMetric | CustomMetric;

export interface ReportPayload {
  appName: string;
  environment: Environment;
  timestamp: number;
  session: SessionInfo;
  context: ContextInfo;
  stayDuration: number;
  metrics: MetricPayload[];
  [key: string]: unknown;
}
