import { PerfMonitorConfig } from './types';

const DEFAULT_CONFIG: PerfMonitorConfig = {
  appName: '',
  reportUrl: '',
  sampleRate: 1,
  reportInterval: 10000,
};

let currentConfig: PerfMonitorConfig = { ...DEFAULT_CONFIG };

export function setConfig(partial: Partial<PerfMonitorConfig>): void {
  currentConfig = { ...currentConfig, ...partial };
}

export function getConfig(): PerfMonitorConfig {
  return currentConfig;
}

export function isInitialized(): boolean {
  return currentConfig.appName !== '' && currentConfig.reportUrl !== '';
}

export function shouldSample(): boolean {
  return Math.random() < currentConfig.sampleRate;
}
