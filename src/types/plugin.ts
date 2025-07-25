import type { Detector } from './index';

export interface Plugin {
  name: string;
  version: string;
  description?: string;
  detectors: Detector[];
  install?(context: PluginContext): void | Promise<void>;
  uninstall?(): void | Promise<void>;
}

export interface PluginContext {
  registerDetector(detector: Detector): void;
  unregisterDetector(name: string): void;
  getDetector(name: string): Detector | undefined;
  getAllDetectors(): Detector[];
  emit(event: string, data?: unknown): void;
  on(event: string, handler: EventHandler): void;
  off(event: string, handler: EventHandler): void;
}

export type EventHandler = (data?: unknown) => void | Promise<void>;

export interface PluginManager {
  use(plugin: Plugin): void;
  remove(pluginName: string): void;
  get(pluginName: string): Plugin | undefined;
  getAll(): Plugin[];
  clear(): void;
}