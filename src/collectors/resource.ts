import { addMetric } from '../store';
import { ResourceMetric } from '../types';

const TARGET_TYPES = new Set(['script', 'link', 'img']);

function extractResourceEntry(entry: PerformanceResourceTiming): ResourceMetric | null {
  const initiatorType = entry.initiatorType;

  if (initiatorType === 'script' || initiatorType === 'link' || initiatorType === 'img' || initiatorType === 'css') {
    return {
      name: entry.name,
      initiatorType,
      duration: entry.duration,
      transferSize: entry.transferSize,
      startTime: entry.startTime,
      protocol: entry.nextHopProtocol || '',
    };
  }

  return null;
}

function recordExistingResources(): void {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  for (const entry of entries) {
    const metric = extractResourceEntry(entry);
    if (metric) {
      addMetric(metric);
    }
  }
}

function observeNewResources(): void {
  try {
    const po = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries() as PerformanceResourceTiming[];
      for (const entry of entries) {
        const metric = extractResourceEntry(entry);
        if (metric) {
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
