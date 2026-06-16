import { addMetric } from '../store';
import { CustomMetric } from '../types';
import { shouldKeepCustom } from '../filter';
import { getCurrentRoute } from '../context';

export interface TrackEventOptions {
  duration?: number;
  extra?: Record<string, unknown>;
  sampleRate?: number;
}

export function trackEvent(name: string, options?: TrackEventOptions): void {
  const route = getCurrentRoute();
  const metric: CustomMetric = {
    type: 'custom',
    name,
    duration: options?.duration,
    extra: options?.extra,
    timestamp: Date.now(),
    route,
  };

  if (options?.sampleRate !== undefined) {
    if (options.sampleRate <= 0 || Math.random() >= options.sampleRate) {
      return;
    }
  }

  if (shouldKeepCustom(metric)) {
    addMetric(metric);
  }
}
