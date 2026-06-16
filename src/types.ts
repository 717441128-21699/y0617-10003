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

export type MetricPayload = WebVitalMetric | ResourceMetric | ErrorMetric;

export interface ReportPayload {
  appName: string;
  timestamp: number;
  metrics: MetricPayload[];
}
