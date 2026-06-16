import { getPlugins, getBatchPlugins } from './config';
import { MetricPayload, ReportPayload } from './types';
import { logDebug } from './debug';

export function applyPlugins(metric: MetricPayload): MetricPayload | null {
  const plugins = getPlugins();
  let current: MetricPayload | null = metric;

  for (const plugin of plugins) {
    if (current === null) break;

    try {
      const result = plugin(current);
      if (result === null || result === undefined) {
        logDebug('dropped', current, 'metric plugin returned null/undefined');
        return null;
      }
      current = result as MetricPayload;
    } catch (err) {
      logDebug(
        'dropped',
        current,
        `metric plugin error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  return current;
}

export function applyPluginsToBatch(metrics: MetricPayload[]): MetricPayload[] {
  const result: MetricPayload[] = [];
  for (const metric of metrics) {
    const processed = applyPlugins(metric);
    if (processed !== null) {
      result.push(processed);
    }
  }
  return result;
}

export function applyBatchPlugins(payload: ReportPayload): ReportPayload | null {
  const plugins = getBatchPlugins();
  let current: ReportPayload | null = payload;

  for (const plugin of plugins) {
    if (current === null) break;

    try {
      const result = plugin(current);
      if (result === null || result === undefined) {
        logDebug('dropped', null, 'batch plugin returned null/undefined - skipped batch');
        return null;
      }
      current = result as ReportPayload;
    } catch (err) {
      logDebug('dropped', null, `batch plugin error: ${err instanceof Error ? err.message : String(err)} - continuing with original payload`);
    }
  }

  return current;
}
