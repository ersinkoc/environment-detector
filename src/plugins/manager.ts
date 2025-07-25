import type { Plugin, PluginManager } from '@/types/plugin';
import { PluginContextImpl } from './base';

export class PluginManagerImpl implements PluginManager {
  private static instance: PluginManagerImpl;
  private plugins = new Map<string, Plugin>();
  private context = new PluginContextImpl();

  private constructor() {}

  public static getInstance(): PluginManagerImpl {
    if (!PluginManagerImpl.instance) {
      PluginManagerImpl.instance = new PluginManagerImpl();
    }
    return PluginManagerImpl.instance;
  }

  public async use(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin '${plugin.name}' is already installed`);
    }

    try {
      await plugin.install?.(this.context);
      this.plugins.set(plugin.name, plugin);
      this.context.emit('plugin:installed', { plugin });
    } catch (error) {
      this.context.emit('plugin:error', { plugin, error });
      throw new Error(`Failed to install plugin '${plugin.name}': ${error}`);
    }
  }

  public async remove(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin '${pluginName}' is not installed`);
    }

    try {
      // Unregister all detectors from this plugin
      for (const detector of plugin.detectors) {
        this.context.unregisterDetector(detector.name);
      }

      await plugin.uninstall?.();
      this.plugins.delete(pluginName);
      this.context.emit('plugin:removed', { plugin });
    } catch (error) {
      this.context.emit('plugin:error', { plugin, error });
      throw new Error(`Failed to remove plugin '${pluginName}': ${error}`);
    }
  }

  public get(pluginName: string): Plugin | undefined {
    return this.plugins.get(pluginName);
  }

  public getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  public clear(): void {
    for (const pluginName of this.plugins.keys()) {
      try {
        this.remove(pluginName);
      } catch (error) {
        console.error(`Error removing plugin '${pluginName}':`, error);
      }
    }
  }

  public getContext(): PluginContextImpl {
    return this.context;
  }
}