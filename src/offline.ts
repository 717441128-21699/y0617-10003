import { ReportPayload } from './types';

const STORAGE_KEY = '__perf_monitor_pending__';
const MAX_PENDING = 20;

function isLocalStorageAvailable(): boolean {
  try {
    const key = '__perf_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function savePendingPayload(payload: ReportPayload): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const pending: ReportPayload[] = raw ? JSON.parse(raw) : [];

    pending.push(payload);
    if (pending.length > MAX_PENDING) {
      pending.splice(0, pending.length - MAX_PENDING);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // localStorage quota exceeded or parse error
  }
}

export function drainPendingPayloads(): ReportPayload[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const pending: ReportPayload[] = JSON.parse(raw);
    localStorage.removeItem(STORAGE_KEY);

    return pending;
  } catch {
    return [];
  }
}

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}
