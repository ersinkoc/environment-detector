import type { Plugin, PluginContext, EventHandler } from '@/types/plugin';
import type { Detector } from '@/types';

export abstract class BasePlugin implements Plugin {
  public abstract readonly name: string;
  public abstract readonly version: string;
  public description?: string;
  public abstract readonly detectors: Detector[];

  public async install(context: PluginContext): Promise<void> {
    // Register all detectors from this plugin
    for (const detector of this.detectors) {
      context.registerDetector(detector);
    }

    // Call custom installation logic
    await this.onInstall?.(context);
  }

  public async uninstall(): Promise<void> {
    // Call custom uninstallation logic
    await this.onUninstall?.();
  }

  protected onInstall?(context: PluginContext): void | Promise<void>;
  protected onUninstall?(): void | Promise<void>;
}

export class PluginContextImpl implements PluginContext {
  private detectors = new Map<string, Detector>();
  private eventHandlers = new Map<string, EventHandler[]>();

  public registerDetector(detector: Detector): void {
    this.detectors.set(detector.name, detector);
  }

  public unregisterDetector(name: string): void {
    this.detectors.delete(name);
  }

  public getDetector(name: string): Detector | undefined {
    return this.detectors.get(name);
  }

  public getAllDetectors(): Detector[] {
    return Array.from(this.detectors.values());
  }

  public emit(event: string, data?: unknown): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          const result = handler(data);
          if (result instanceof Promise) {
            result.catch((error) => {
              console.error(`Error in event handler for '${event}':`, error);
            });
          }
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      }
    }
  }

  public on(event: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}