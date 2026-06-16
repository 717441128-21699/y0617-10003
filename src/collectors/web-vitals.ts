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

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
  startTime: number;
}

const SESSION_GAP = 1000;
const SESSION_LIMIT = 5000;

function observeCLS(): void {
  try {
    let clsValue = 0;
    let sessionValue = 0;
    let sessionStartTime = 0;
    let sessionEntries: LayoutShiftEntry[] = [];
    let reported = false;

    const po = new PerformanceObserver((entryList) => {
      for (const rawEntry of entryList.getEntries()) {
        const entry = rawEntry as unknown as LayoutShiftEntry;
        if (entry.hadRecentInput) continue;

        const now = entry.startTime;

        if (sessionEntries.length === 0) {
          sessionStartTime = now;
        }

        if (now - sessionStartTime > SESSION_LIMIT || now - (sessionEntries[sessionEntries.length - 1]?.startTime ?? now) > SESSION_GAP) {
          if (sessionValue > clsValue) {
            clsValue = sessionValue;
          }
          sessionValue = 0;
          sessionStartTime = now;
          sessionEntries = [];
        }

        sessionValue += entry.value;
        sessionEntries.push(entry);
      }

      if (sessionValue > clsValue) {
        clsValue = sessionValue;
      }
    });

    po.observe({ type: 'layout-shift', buffered: true });

    const finalizeCLS = (): void => {
      if (reported) return;
      reported = true;
      if (sessionValue > clsValue) {
        clsValue = sessionValue;
      }
      if (clsValue > 0) {
        recordMetric('CLS', Math.round(clsValue * 1e6) / 1e6);
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        finalizeCLS();
      }
    });

    window.addEventListener('pagehide', () => {
      finalizeCLS();
    });
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
