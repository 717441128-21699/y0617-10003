import { addMetric } from '../store';
import { ErrorMetric } from '../types';

function formatStack(stack: string | undefined): string {
  if (!stack) return '';
  return stack.split('\n').slice(0, 10).join('\n');
}

function handleJSError(
  message: string | Event,
  source: string | undefined,
  lineno: number | undefined,
  colno: number | undefined,
  error: Error | undefined,
): void {
  const metric: ErrorMetric = {
    type: 'js-error',
    message: typeof message === 'string' ? message : (message as Event).type,
    stack: formatStack(error?.stack),
    filename: source || '',
    lineno: lineno || 0,
    colno: colno || 0,
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
    filename: '',
    lineno: 0,
    colno: 0,
    timestamp: Date.now(),
  };
  addMetric(metric);
}

export function collectErrors(): void {
  window.addEventListener('error', handleJSError as EventListener, true);
  window.addEventListener('unhandledrejection', handlePromiseRejection, true);
}
