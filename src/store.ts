import { MetricPayload } from './types';

const buffer: MetricPayload[] = [];
const MAX_BUFFER_SIZE = 200;

export function addMetric(metric: MetricPayload): void {
  if (buffer.length >= MAX_BUFFER_SIZE) {
    buffer.shift();
  }
  buffer.push(metric);
}

export function drainMetrics(): MetricPayload[] {
  const metrics = buffer.slice();
  buffer.length = 0;
  return metrics;
}

export function getBufferSize(): number {
  return buffer.length;
}
