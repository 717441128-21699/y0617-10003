import { addMetric } from '../store';
import { ErrorMetric } from '../types';

function formatStack(stack: string | undefined): string {
  if (!stack) return '';
  return stack.split('\n').slice(0, 10).join('\n');
}

function handleJSError(event: ErrorEvent): void {
  const metric: ErrorMetric = {
    type: 'js-error',
    message: event.message || '',
    stack: formatStack(event.error?.stack),
    filename: event.filename || '',
    lineno: event.lineno || 0,
    colno: event.colno || 0,
    timestamp: Date.now(),
  };
  addMetric(metric);
}

function handlePromiseRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason;
  const metric: ErrorMetric = {
    type: 'promise-rejection',
    message: reason instanceof Error ? reason.message : String(reason),
    stack: formatStack(reason instanceof Error ? reason.stack : undefined),
    filename: reason instanceof Error ? (reason.stack?.split('\n')[1]?.trim() || '') : '',
    lineno: 0,
    colno: 0,
    timestamp: Date.now(),
  };
  addMetric(metric);
}

export function collectErrors(): void {
  window.addEventListener('error', handleJSError, true);
  window.addEventListener('unhandledrejection', handlePromiseRejection, true);
}
