import { addMetric } from '../store';
import { ErrorMetric } from '../types';
import { getConfig } from '../config';
import { shouldKeepError } from '../filter';
import { getCurrentRoute } from '../context';

function processStack(stack: string | undefined, error: Error | null): string {
  if (!stack) return '';
  const config = getConfig();
  if (config.stackProcessor) {
    try {
      return config.stackProcessor(stack, error);
    } catch {
      return stack;
    }
  }
  return stack;
}

function handleJSError(event: ErrorEvent): void {
  const route = getCurrentRoute();
  const err = event.error ?? null;
  const metric: ErrorMetric = {
    type: 'js-error',
    message: event.message || '',
    stack: processStack(err?.stack, err),
    filename: event.filename || '',
    lineno: event.lineno || 0,
    colno: event.colno || 0,
    timestamp: Date.now(),
    route,
  };
  if (shouldKeepError(metric)) {
    addMetric(metric);
  }
}

function handlePromiseRejection(event: PromiseRejectionEvent): void {
  const route = getCurrentRoute();
  const reason = event.reason;
  const err = reason instanceof Error ? reason : null;
  const metric: ErrorMetric = {
    type: 'promise-rejection',
    message: err ? err.message : String(reason),
    stack: processStack(err?.stack, err),
    filename: err ? (err.stack?.split('\n')[1]?.trim() || '') : '',
    lineno: 0,
    colno: 0,
    timestamp: Date.now(),
    route,
  };
  if (shouldKeepError(metric)) {
    addMetric(metric);
  }
}

export function collectErrors(): void {
  window.addEventListener('error', handleJSError, true);
  window.addEventListener('unhandledrejection', handlePromiseRejection, true);
}
