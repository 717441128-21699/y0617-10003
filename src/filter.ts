import { getConfig } from './config';
import {
  WebVitalMetric,
  ResourceMetric,
  ErrorMetric,
  CustomMetric,
  ErrorSampleRule,
  ErrorTypeSampleConfig,
} from './types';

function samplePass(rate: number | undefined): boolean {
  if (rate === undefined || rate >= 1) return true;
  if (rate <= 0) return false;
  return Math.random() < rate;
}

function matchesPattern(str: string, patterns: string[]): boolean {
  return patterns.some((p) => str.indexOf(p) !== -1);
}

function findMatchingRule(message: string, rules: ErrorSampleRule[]): ErrorSampleRule | null {
  for (const rule of rules) {
    if (message.indexOf(rule.pattern) !== -1) {
      return rule;
    }
  }
  return null;
}

export interface FilterResult {
  keep: boolean;
  reason: string;
}

export function shouldKeepWebVital(metric: WebVitalMetric): FilterResult {
  const config = getConfig();
  const filter = config.filters?.webVitals;

  if (filter === false) return { keep: false, reason: 'web-vitals disabled' };
  if (filter === undefined || filter === true) return { keep: true, reason: 'default pass' };

  if (filter.exclude && filter.exclude.indexOf(metric.type as 'LCP' | 'FID' | 'CLS') !== -1) {
    return { keep: false, reason: `excluded type: ${metric.type}` };
  }

  if (!samplePass(filter.sampleRate)) {
    return { keep: false, reason: `sample rate: ${filter.sampleRate}` };
  }

  return { keep: true, reason: 'filter pass' };
}

export function shouldKeepResource(metric: ResourceMetric): FilterResult {
  const config = getConfig();
  const filter = config.filters?.resources;

  if (filter === false) return { keep: false, reason: 'resources disabled' };
  if (filter === undefined || filter === true) return { keep: true, reason: 'default pass' };

  if (filter.initiatorTypes && filter.initiatorTypes.indexOf(metric.initiatorType) === -1) {
    return { keep: false, reason: `initiator type excluded: ${metric.initiatorType}` };
  }

  if (filter.include && filter.include.length > 0) {
    if (!matchesPattern(metric.name, filter.include)) {
      return { keep: false, reason: 'not in include list' };
    }
  }

  if (filter.exclude && filter.exclude.length > 0) {
    if (matchesPattern(metric.name, filter.exclude)) {
      return { keep: false, reason: `matched exclude pattern` };
    }
  }

  if (!samplePass(filter.sampleRate)) {
    return { keep: false, reason: `sample rate: ${filter.sampleRate}` };
  }

  return { keep: true, reason: 'filter pass' };
}

export function shouldKeepError(metric: ErrorMetric): FilterResult {
  const config = getConfig();
  const filter = config.filters?.errors;

  if (filter === false) return { keep: false, reason: 'errors disabled' };
  if (filter === undefined || filter === true) return { keep: true, reason: 'default pass' };

  if (filter.excludeTypes && filter.excludeTypes.indexOf(metric.type) !== -1) {
    return { keep: false, reason: `excluded type: ${metric.type}` };
  }

  const typeConfig: ErrorTypeSampleConfig | undefined = filter.byType?.[metric.type];

  if (typeConfig?.excludeMessages && typeConfig.excludeMessages.length > 0) {
    if (matchesPattern(metric.message, typeConfig.excludeMessages)) {
      return { keep: false, reason: `${metric.type} exclude message` };
    }
  }
  if (filter.excludeMessages && filter.excludeMessages.length > 0) {
    if (matchesPattern(metric.message, filter.excludeMessages)) {
      return { keep: false, reason: `matched exclude message` };
    }
  }

  if (typeConfig?.sampleRules && typeConfig.sampleRules.length > 0) {
    const rule = findMatchingRule(metric.message, typeConfig.sampleRules);
    if (rule) {
      if (!samplePass(rule.sampleRate)) {
        return { keep: false, reason: `${metric.type} rule ${rule.pattern} rate: ${rule.sampleRate}` };
      }
      return { keep: true, reason: `${metric.type} rule ${rule.pattern} pass` };
    }
  }

  if (filter.sampleRules && filter.sampleRules.length > 0) {
    const rule = findMatchingRule(metric.message, filter.sampleRules);
    if (rule) {
      if (!samplePass(rule.sampleRate)) {
        return { keep: false, reason: `rule ${rule.pattern} rate: ${rule.sampleRate}` };
      }
      return { keep: true, reason: `rule ${rule.pattern} pass` };
    }
  }

  if (typeConfig?.sampleRate !== undefined) {
    if (!samplePass(typeConfig.sampleRate)) {
      return { keep: false, reason: `${metric.type} rate: ${typeConfig.sampleRate}` };
    }
    return { keep: true, reason: `${metric.type} sample pass` };
  }

  if (!samplePass(filter.sampleRate)) {
    return { keep: false, reason: `sample rate: ${filter.sampleRate}` };
  }

  return { keep: true, reason: 'filter pass' };
}

export function shouldKeepCustom(metric: CustomMetric): FilterResult {
  const config = getConfig();
  const filter = config.filters?.custom;

  if (filter === false) return { keep: false, reason: 'custom disabled' };
  if (filter === undefined || filter === true) return { keep: true, reason: 'default pass' };

  if (filter.excludeNames && filter.excludeNames.length > 0) {
    if (matchesPattern(metric.name, filter.excludeNames)) {
      return { keep: false, reason: `excluded name pattern` };
    }
  }

  if (!samplePass(filter.sampleRate)) {
    return { keep: false, reason: `sample rate: ${filter.sampleRate}` };
  }

  return { keep: true, reason: 'filter pass' };
}
