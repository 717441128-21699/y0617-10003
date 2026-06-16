import { getPlugins } from './config';
import { MetricPayload } from './types';
import { logDebug } from './debug';

export function applyPlugins(metric: MetricPayload): MetricPayload | null {
  const plugins = getPlugins();
  let current: MetricPayload | null = metric;

  for (const plugin of plugins) {
    if (current === null) break;

    try {
      const result = plugin(current);
      if (result === null || result === undefined) {
        logDebug('dropped', current, 'plugin returned null/undefined');
        return null;
      }
      current = result as MetricPayload;
    } catch (err) {
      logDebug('dropped', current, `plugin error: ${err instanceof Error ? err.message : String(err)}`);
      // continue with original metric, don't drop it just because plugin failed
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
