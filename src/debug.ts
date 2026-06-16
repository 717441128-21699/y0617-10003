import { getConfig } from './config';
import { MetricPayload, TransportType } from './types';

export type DebugAction =
  | 'collected'
  | 'filtered'
  | 'sampled'
  | 'sent'
  | 'queued'
  | 'dropped'
  | 'retry'
  | 'transport'
  | 'dryrun';

export interface DebugEntry {
  action: DebugAction;
  metric: MetricPayload | null;
  reason?: string;
  transport?: TransportType;
  retryCount?: number;
  payload?: unknown;
  timestamp: number;
}

const debugLog: DebugEntry[] = [];
const MAX_DEBUG_LOG = 500;

function getMetricType(metric: MetricPayload | null): string {
  if (!metric) return 'unknown';
  if ('type' in metric) {
    const t = (metric as any).type;
    if (t === 'LCP' || t === 'FID' || t === 'CLS') return 'web-vitals';
    if (t === 'js-error' || t === 'promise-rejection') return 'error';
    return t;
  }
  return 'unknown';
}

function formatMetric(metric: MetricPayload | null): string {
  if (!metric) return 'null';
  const m = metric as any;
  switch (getMetricType(metric)) {
    case 'web-vitals':
      return `${m.type}=${m.value} (${m.rating})`;
    case 'resource':
      return `${m.initiatorType}: ${m.name}`;
    case 'error':
      return `${m.type}: ${m.message}`;
    case 'custom':
      return `custom: ${m.name}`;
    default:
      return JSON.stringify(metric);
  }
}

function shouldLog(): boolean {
  const debug = getConfig().debug;
  return debug === true || debug === 'silent';
}

function shouldOutput(): boolean {
  return getConfig().debug === true;
}

function getStyle(color: string): string {
  return `color: ${color}; font-weight: bold;`;
}

export function logDebug(
  action: DebugAction,
  metric: MetricPayload | null,
  reason?: string,
  extra?: Partial<DebugEntry>,
): void {
  if (!shouldLog()) return;

  const entry: DebugEntry = {
    action,
    metric,
    reason,
    timestamp: Date.now(),
    ...extra,
  };

  if (debugLog.length >= MAX_DEBUG_LOG) {
    debugLog.shift();
  }
  debugLog.push(entry);

  if (!shouldOutput()) return;

  const metricType = getMetricType(metric);
  const formatted = formatMetric(metric);

  switch (action) {
    case 'collected':
      console.log(
        `%c[PerfMonitor] %ccollected%c ${metricType}`,
        getStyle('#999'),
        getStyle('#2ecc71'),
        getStyle(''),
        formatted,
      );
      break;
    case 'filtered':
      console.log(
        `%c[PerfMonitor] %cfiltered%c ${metricType}`,
        getStyle('#999'),
        getStyle('#f39c12'),
        getStyle(''),
        `${formatted} (reason: ${reason})`,
      );
      break;
    case 'sampled':
      console.log(
        `%c[PerfMonitor] %csampled-out%c ${metricType}`,
        getStyle('#999'),
        getStyle('#f39c12'),
        getStyle(''),
        `${formatted} (reason: ${reason})`,
      );
      break;
    case 'sent':
      console.log(
        `%c[PerfMonitor] %csent%c batch via ${extra?.transport || 'unknown'}`,
        getStyle('#999'),
        getStyle('#3498db'),
        getStyle(''),
        reason || formatted,
      );
      break;
    case 'queued':
      console.log(
        `%c[PerfMonitor] %cqueued%c offline`,
        getStyle('#999'),
        getStyle('#9b59b6'),
        getStyle(''),
        reason || formatted,
      );
      break;
    case 'dropped':
      console.log(
        `%c[PerfMonitor] %cdropped%c`,
        getStyle('#999'),
        getStyle('#e74c3c'),
        getStyle(''),
        `${formatted} (reason: ${reason})`,
      );
      break;
    case 'retry':
      console.log(
        `%c[PerfMonitor] %cretry%c #${extra?.retryCount || 1} via ${extra?.transport || 'unknown'}`,
        getStyle('#999'),
        getStyle('#e67e22'),
        getStyle(''),
        `${reason || ''}`,
      );
      break;
    case 'transport':
      console.log(
        `%c[PerfMonitor] %ctransport%c ${extra?.transport || 'unknown'}`,
        getStyle('#999'),
        getStyle('#3498db'),
        getStyle(''),
        reason || '',
      );
      break;
    case 'dryrun':
      console.log(
        `%c[PerfMonitor] %cdry-run%c would send`,
        getStyle('#999'),
        getStyle('#1abc9c'),
        getStyle(''),
        reason || '',
      );
      break;
  }
}

export function getDebugLog(): DebugEntry[] {
  return debugLog.slice();
}

export function clearDebugLog(): void {
  debugLog.length = 0;
}
