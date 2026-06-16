import { ReportPayload } from './types';

const STORAGE_KEY = '__perf_monitor_pending__';
const MAX_PENDING = 50;

let storageAvailable: boolean | null = null;

function isLocalStorageAvailable(): boolean {
  if (storageAvailable !== null) return storageAvailable;
  try {
    const key = '__perf_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

function readAll(): ReportPayload[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeAll(payloads: ReportPayload[]): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payloads));
  } catch {
    // quota exceeded
  }
}

export function appendPendingPayload(payload: ReportPayload): void {
  const list = readAll();
  list.push(payload);
  if (list.length > MAX_PENDING) {
    list.splice(0, list.length - MAX_PENDING);
  }
  writeAll(list);
}

export function peekFirstPending(): ReportPayload | null {
  const list = readAll();
  return list.length > 0 ? list[0] : null;
}

export function shiftFirstPending(): void {
  const list = readAll();
  if (list.length > 0) {
    list.shift();
    writeAll(list);
  }
}

export function getPendingCount(): number {
  return readAll().length;
}

export function isOnline(): boolean {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine !== false;
}
