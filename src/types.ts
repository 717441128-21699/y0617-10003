export interface PerfMonitorConfig {
  appName: string;
  reportUrl: string;
  sampleRate: number;
  reportInterval: number;
}

export interface WebVitalMetric {
  type: 'LCP' | 'FID' | 'CLS';
  value: number;
  timestamp: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export interface ResourceMetric {
  name: string;
  initiatorType: string;
  duration: number;
  transferSize: number;
  startTime: number;
  protocol: string;
}

export interface ErrorMetric {
  type: 'js-error' | 'promise-rejection';
  message: string;
  stack: string;
  filename: string;
  lineno: number;
  colno: number;
  timestamp: number;
}

export interface CustomMetric {
  type: 'custom';
  name: string;
  duration?: number;
  extra?: Record<string, unknown>;
  timestamp: number;
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

export type MetricPayload = WebVitalMetric | ResourceMetric | ErrorMetric | CustomMetric;

export interface ReportPayload {
  appName: string;
  timestamp: number;
  context: ContextInfo;
  metrics: MetricPayload[];
}
