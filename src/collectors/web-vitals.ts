import { addMetric } from '../store';
import { WebVitalMetric } from '../types';

type MetricType = 'LCP' | 'FID' | 'CLS';

function getRating(type: MetricType, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<MetricType, [number, number]> = {
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
  };
  const [good, poor] = thresholds[type];
  if (value <= good) return 'good';
  if (value <= poor) return 'needs-improvement';
  return 'poor';
}

function recordMetric(type: MetricType, value: number): void {
  const metric: WebVitalMetric = {
    type,
    value,
    timestamp: Date.now(),
    rating: getRating(type, value),
  };
  addMetric(metric);
}

function observeLCP(): void {
  try {
    const po = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      if (entries.length > 0) {
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
        const value = lastEntry.renderTime ?? lastEntry.loadTime ?? lastEntry.startTime;
        recordMetric('LCP', value);
      }
    });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch {
    // browser does not support LCP
  }
}

function observeFID(): void {
  try {
    const po = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      for (const entry of entries) {
        const fidEntry = entry as PerformanceEntry & { processingStart: number };
        recordMetric('FID', fidEntry.processingStart - fidEntry.startTime);
      }
    });
    po.observe({ type: 'first-input', buffered: true });
  } catch {
    // browser does not support FID
  }
}

function observeCLS(): void {
  try {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    const po = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (layoutShift.hadRecentInput) continue;

        const firstSessionEntry = sessionEntries.length === 0;
        if (firstSessionEntry) {
          sessionValue = 0;
          sessionEntries = [];
        }

        sessionValue += layoutShift.value;
        sessionEntries.push(entry);

        if (sessionValue > clsValue) {
          clsValue = sessionValue;
        }
      }
    });

    po.observe({ type: 'layout-shift', buffered: true });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        if (clsValue > 0) {
          recordMetric('CLS', clsValue);
        }
      }
    });

    setTimeout(() => {
      if (clsValue > 0) {
        recordMetric('CLS', clsValue);
      }
    }, 30000);
  } catch {
    // browser does not support CLS
  }
}

export function collectWebVitals(): void {
  if (typeof PerformanceObserver === 'undefined') return;

  observeLCP();
  observeFID();
  observeCLS();
}
