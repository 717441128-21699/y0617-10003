import { addMetric } from '../store';
import { ResourceMetric } from '../types';
import { shouldKeepResource } from '../filter';
import { getCurrentRoute } from '../context';

function extractResourceEntry(entry: PerformanceResourceTiming, route: string): ResourceMetric | null {
  const initiatorType = entry.initiatorType;

  if (
    initiatorType === 'script' ||
    initiatorType === 'link' ||
    initiatorType === 'img' ||
    initiatorType === 'css'
  ) {
    return {
      name: entry.name,
      initiatorType,
      duration: entry.duration,
      transferSize: entry.transferSize,
      startTime: entry.startTime,
      protocol: entry.nextHopProtocol || '',
      route,
    };
  }

  return null;
}

function recordExistingResources(): void {
  const route = getCurrentRoute();
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  for (const entry of entries) {
    const metric = extractResourceEntry(entry, route);
    if (metric && shouldKeepResource(metric)) {
      addMetric(metric);
    }
  }
}

function observeNewResources(): void {
  try {
    const po = new PerformanceObserver((entryList) => {
      const route = getCurrentRoute();
      const entries = entryList.getEntries() as PerformanceResourceTiming[];
      for (const entry of entries) {
        const metric = extractResourceEntry(entry, route);
        if (metric && shouldKeepResource(metric)) {
          addMetric(metric);
        }
      }
    });
    po.observe({ type: 'resource', buffered: false });
  } catch {
    // browser does not support resource timing observer
  }
}

export function collectResources(): void {
  if (typeof performance === 'undefined' || typeof PerformanceObserver === 'undefined') return;

  if (typeof performance.getEntriesByType === 'function') {
    recordExistingResources();
  }

  observeNewResources();
}
