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

export interface ErrorFilter {
  sampleRate?: number;
  excludeMessages?: string[];
  excludeTypes?: ('js-error' | 'promise-rejection')[];
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

export interface PerfMonitorConfig {
  appName: string;
  reportUrl: string;
  sampleRate: number;
  reportInterval: number;
  filters: FilterConfig;
  stackProcessor?: StackProcessor;
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
  timestamp: number;
  session: SessionInfo;
  context: ContextInfo;
  stayDuration: number;
  metrics: MetricPayload[];
}
