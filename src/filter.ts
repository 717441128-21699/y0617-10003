import { getConfig } from './config';
import { WebVitalMetric, ResourceMetric, ErrorMetric, CustomMetric } from './types';

function samplePass(rate: number | undefined): boolean {
  if (rate === undefined || rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() < rate;
}

function matchesPattern(str: string, patterns: string[]): boolean {
  return patterns.some((p) => str.indexOf(p) !== -1);
}

export function shouldKeepWebVital(metric: WebVitalMetric): boolean {
  const config = getConfig();
  const filter = config.filters?.webVitals;

  if (filter === false) return false;
  if (filter === undefined || filter === true) return true;

  if (filter.exclude && filter.exclude.indexOf(metric.type as 'LCP' | 'FID' | 'CLS') !== -1) {
    return false;
  }

  return samplePass(filter.sampleRate);
}

export function shouldKeepResource(metric: ResourceMetric): boolean {
  const config = getConfig();
  const filter = config.filters?.resources;

  if (filter === false) return false;
  if (filter === undefined || filter === true) return true;

  if (filter.initiatorTypes && filter.initiatorTypes.indexOf(metric.initiatorType) === -1) {
    return false;
  }

  if (filter.include && filter.include.length > 0) {
    if (!matchesPattern(metric.name, filter.include)) {
      return false;
    }
  }

  if (filter.exclude && filter.exclude.length > 0) {
    if (matchesPattern(metric.name, filter.exclude)) {
      return false;
    }
  }

  return samplePass(filter.sampleRate);
}

export function shouldKeepError(metric: ErrorMetric): boolean {
  const config = getConfig();
  const filter = config.filters?.errors;

  if (filter === false) return false;
  if (filter === undefined || filter === true) return true;

  if (filter.excludeTypes && filter.excludeTypes.indexOf(metric.type) !== -1) {
    return false;
  }

  if (filter.excludeMessages && filter.excludeMessages.length > 0) {
    if (matchesPattern(metric.message, filter.excludeMessages)) {
      return false;
    }
  }

  return samplePass(filter.sampleRate);
}

export function shouldKeepCustom(metric: CustomMetric): boolean {
  const config = getConfig();
  const filter = config.filters?.custom;

  if (filter === false) return false;
  if (filter === undefined || filter === true) return true;

  if (filter.excludeNames && filter.excludeNames.length > 0) {
    if (matchesPattern(metric.name, filter.excludeNames)) {
      return false;
    }
  }

  return samplePass(filter.sampleRate);
}
