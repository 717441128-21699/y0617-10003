import { addMetric } from '../store';
import { CustomMetric } from '../types';

export interface TrackEventOptions {
  duration?: number;
  extra?: Record<string, unknown>;
}

export function trackEvent(name: string, options?: TrackEventOptions): void {
  const metric: CustomMetric = {
    type: 'custom',
    name,
    duration: options?.duration,
    extra: options?.extra,
    timestamp: Date.now(),
  };
  addMetric(metric);
}
