import { PluginManagerImpl } from '../../../src/plugins/manager';
import { BasePlugin } from '../../../src/plugins/base';
import type { Plugin, PluginContext } from '../../../src/types/plugin';

// Mock plugin for testing
class MockPlugin extends BasePlugin {
  public readonly name: string;
  public readonly version = '1.0.0';
  public detectors = [];
  public installCalled = false;
  public uninstallCalled = false;
  public installError?: Error;
  public uninstallError?: Error;

  constructor(name: string = 'mock-plugin') {
    super();
    this.name = name;
  }

  public override async install(context: PluginContext): Promise<void> {
    this.installCalled = true;
    if (this.installError) {
      throw this.installError;
    }
    await super.install(context);
  }

  public override async uninstall(): Promise<void> {
    this.uninstallCalled = true;
    if (this.uninstallError) {
      throw this.uninstallError;
    }
    await super.uninstall();
  }
}

// Additional mock for edge case testing
class MinimalMockPlugin implements Plugin {
  public readonly name: string;
  public readonly version = '1.0.0';
  public readonly detectors = [];
  public installCalled = false;
  public uninstallCalled = false;
  public shouldThrowOnInstall = false;
  public shouldThrowOnUninstall = false;

  constructor(name: string = 'minimal-mock') {
    this.name = name;
  }

  public async install(_context: PluginContext): Promise<void> {
    this.installCalled = true;
    if (this.shouldThrowOnInstall) {
      throw new Error('Minimal install error');
    }
  }

  public async uninstall(): Promise<void> {
    this.uninstallCalled = true;
    if (this.shouldThrowOnUninstall) {
      throw new Error('Minimal uninstall error');
    }
  }
}

describe('PluginManagerImpl', () => {
  let manager: PluginManagerImpl;

  beforeEach(() => {
    // Clear singleton instance
    (PluginManagerImpl as any).instance = undefined;
    manager = PluginManagerImpl.getInstance();
    jest.clearAllMocks();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = PluginManagerImpl.getInstance();
      const instance2 = PluginManagerImpl.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('use', () => {
    it('should install a plugin successfully', async () => {
      const plugin = new MockPlugin();
      
      await manager.use(plugin);
      
      expect(plugin.installCalled).toBe(true);
      expect(manager.get('mock-plugin')).toBe(plugin);
    });

    it('should emit plugin:installed event', async () => {
      const plugin = new MockPlugin();
      const context = manager.getContext();
      const handler = jest.fn();
      
      context.on('plugin:installed', handler);
      await manager.use(plugin);
      
      expect(handler).toHaveBeenCalledWith({ plugin });
    });

    it('should throw error if plugin is already installed', async () => {
      const plugin = new MockPlugin();
      
      await manager.use(plugin);
      
      await expect(manager.use(plugin)).rejects.toThrow(
        "Plugin 'mock-plugin' is already installed"
      );
    });

    it('should handle plugin installation errors', async () => {
      const plugin = new MockPlugin();
      plugin.installError = new Error('Installation failed');
      const context = manager.getContext();
      const errorHandler = jest.fn();
      
      context.on('plugin:error', errorHandler);
      
      await expect(manager.use(plugin)).rejects.toThrow(
        "Failed to install plugin 'mock-plugin': Error: Installation failed"
      );
      
      expect(errorHandler).toHaveBeenCalledWith({
        plugin,
        error: plugin.installError
      });
      expect(manager.get('mock-plugin')).toBeUndefined();
    });

    it('should handle plugins without install method', async () => {
      const minimalPlugin: Plugin = {
        name: 'minimal',
        version: '1.0.0',
        detectors: []
      };
      
      await expect(manager.use(minimalPlugin)).resolves.not.toThrow();
      expect(manager.get('minimal')).toBe(minimalPlugin);
    });

    it('should handle plugins with custom install implementations', async () => {
      const customPlugin = new MinimalMockPlugin('custom-plugin');
      
      await manager.use(customPlugin);
      
      expect(customPlugin.installCalled).toBe(true);
      expect(manager.get('custom-plugin')).toBe(customPlugin);
    });

    it('should handle install errors from custom plugin implementations', async () => {
      const errorPlugin = new MinimalMockPlugin('error-plugin');
      errorPlugin.shouldThrowOnInstall = true;
      
      const context = manager.getContext();
      const errorHandler = jest.fn();
      context.on('plugin:error', errorHandler);
      
      await expect(manager.use(errorPlugin)).rejects.toThrow(
        "Failed to install plugin 'error-plugin': Error: Minimal install error"
      );
      
      expect(errorHandler).toHaveBeenCalledWith({
        plugin: errorPlugin,
        error: expect.any(Error)
      });
      expect(manager.get('error-plugin')).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should remove an installed plugin', async () => {
      const plugin = new MockPlugin();
      await manager.use(plugin);
      
      await manager.remove('mock-plugin');
      
      expect(plugin.uninstallCalled).toBe(true);
      expect(manager.get('mock-plugin')).toBeUndefined();
    });

    it('should unregister all detectors from the plugin', async () => {
      const plugin = new MockPlugin();
      const mockDetector = {
        name: 'test-detector',
        detect: () => 'result',
        reset: () => {}
      };
      (plugin as any).detectors = [mockDetector];
      
      await manager.use(plugin);
      const context = manager.getContext();
      context.registerDetector(mockDetector); // Manually register for this test
      expect(context.getDetector('test-detector')).toBe(mockDetector);
      
      await manager.remove('mock-plugin');
      
      expect(context.getDetector('test-detector')).toBeUndefined();
    });

    it('should emit plugin:removed event', async () => {
      const plugin = new MockPlugin();
      await manager.use(plugin);
      
      const context = manager.getContext();
      const handler = jest.fn();
      context.on('plugin:removed', handler);
      
      await manager.remove('mock-plugin');
      
      expect(handler).toHaveBeenCalledWith({ plugin });
    });

    it('should throw error if plugin is not installed', async () => {
      await expect(manager.remove('non-existent')).rejects.toThrow(
        "Plugin 'non-existent' is not installed"
      );
    });

    it('should handle plugin uninstall errors', async () => {
      const plugin = new MockPlugin();
      plugin.uninstallError = new Error('Uninstall failed');
      await manager.use(plugin);
      
      const context = manager.getContext();
      const errorHandler = jest.fn();
      context.on('plugin:error', errorHandler);
      
      await expect(manager.remove('mock-plugin')).rejects.toThrow(
        "Failed to remove plugin 'mock-plugin': Error: Uninstall failed"
      );
      
      expect(errorHandler).toHaveBeenCalledWith({
        plugin,
        error: plugin.uninstallError
      });
      // Plugin should remain installed if uninstall fails
      expect(manager.get('mock-plugin')).toBe(plugin);
    });

    it('should handle plugins without uninstall method', async () => {
      const minimalPlugin: Plugin = {
        name: 'minimal',
        version: '1.0.0',
        detectors: []
      };
      
      await manager.use(minimalPlugin);
      await expect(manager.remove('minimal')).resolves.not.toThrow();
      expect(manager.get('minimal')).toBeUndefined();
    });

    it('should handle custom uninstall implementations with errors', async () => {
      const errorPlugin = new MinimalMockPlugin('uninstall-error-plugin');
      errorPlugin.shouldThrowOnUninstall = true;
      
      await manager.use(errorPlugin);
      
      const context = manager.getContext();
      const errorHandler = jest.fn();
      context.on('plugin:error', errorHandler);
      
      await expect(manager.remove('uninstall-error-plugin')).rejects.toThrow(
        "Failed to remove plugin 'uninstall-error-plugin': Error: Minimal uninstall error"
      );
      
      expect(errorHandler).toHaveBeenCalledWith({
        plugin: errorPlugin,
        error: expect.any(Error)
      });
      // Plugin should remain installed if uninstall fails
      expect(manager.get('uninstall-error-plugin')).toBe(errorPlugin);
    });
  });

  describe('get', () => {
    it('should return installed plugin', async () => {
      const plugin = new MockPlugin();
      await manager.use(plugin);
      
      expect(manager.get('mock-plugin')).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', () => {
      expect(manager.get('non-existent')).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all installed plugins', async () => {
      const plugin1 = new MockPlugin('plugin-1');
      const plugin2 = new MockPlugin('plugin-2');
      
      await manager.use(plugin1);
      await manager.use(plugin2);
      
      const all = manager.getAll();
      expect(all).toHaveLength(2);
      expect(all).toContain(plugin1);
      expect(all).toContain(plugin2);
    });

    it('should return empty array when no plugins installed', () => {
      expect(manager.getAll()).toEqual([]);
    });
  });

  describe('clear', () => {
    it('should remove all installed plugins', async () => {
      const plugin1 = new MockPlugin('plugin-1');
      const plugin2 = new MockPlugin('plugin-2');
      
      await manager.use(plugin1);
      await manager.use(plugin2);
      
      // Clear method is sync but calls async remove - need to wait
      manager.clear();
      
      // Wait for async operations to complete
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(manager.getAll()).toEqual([]);
      expect(plugin1.uninstallCalled).toBe(true);
      expect(plugin2.uninstallCalled).toBe(true);
    });

    it('should handle clear by calling remove for each plugin', async () => {
      const plugin1 = new MockPlugin('plugin-1');
      const plugin2 = new MockPlugin('plugin-2');
      
      await manager.use(plugin1);
      await manager.use(plugin2);
      
      const removeSpy = jest.spyOn(manager, 'remove');
      
      manager.clear();
      
      // Clear should call remove for each plugin
      expect(removeSpy).toHaveBeenCalledTimes(2);
      expect(removeSpy).toHaveBeenCalledWith('plugin-1');
      expect(removeSpy).toHaveBeenCalledWith('plugin-2');
      
      removeSpy.mockRestore();
    });

    it('should handle synchronous errors in clear', async () => {
      const plugin1 = new MockPlugin('plugin-1');
      
      // Install plugin first
      await manager.use(plugin1);
      
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      const removeSpy = jest.spyOn(manager, 'remove').mockImplementation((_pluginName: string) => {
        throw new Error('Synchronous error in remove');
      });
      
      // This should not throw and should handle the error gracefully
      expect(() => manager.clear()).not.toThrow();
      
      expect(removeSpy).toHaveBeenCalledWith('plugin-1');
      expect(consoleError).toHaveBeenCalledWith(
        "Error removing plugin 'plugin-1':",
        expect.any(Error)
      );
      
      consoleError.mockRestore();
      removeSpy.mockRestore();
    });

    it('should work when no plugins are installed', () => {
      expect(() => manager.clear()).not.toThrow();
    });
  });

  describe('getContext', () => {
    it('should return the plugin context', () => {
      const context = manager.getContext();
      expect(context).toBeDefined();
      expect(context.registerDetector).toBeDefined();
      expect(context.emit).toBeDefined();
      expect(context.on).toBeDefined();
    });

    it('should return the same context instance', () => {
      const context1 = manager.getContext();
      const context2 = manager.getContext();
      expect(context1).toBe(context2);
    });
  });

  describe('plugin context integration', () => {
    it('should properly handle detector registration during plugin installation', async () => {
      const plugin = new MockPlugin();
      const mockDetector = {
        name: 'integration-detector',
        detect: () => 'integration-result',
        reset: () => {}
      };
      (plugin as any).detectors = [mockDetector];
      
      const context = manager.getContext();
      const registerSpy = jest.spyOn(context, 'registerDetector');
      
      await manager.use(plugin);
      
      expect(registerSpy).toHaveBeenCalledWith(mockDetector);
      expect(context.getDetector('integration-detector')).toBe(mockDetector);
      
      registerSpy.mockRestore();
    });

    it('should handle multiple detectors from a single plugin', async () => {
      const plugin = new MockPlugin();
      const detector1 = {
        name: 'detector-1',
        detect: () => 'result-1',
        reset: () => {}
      };
      const detector2 = {
        name: 'detector-2', 
        detect: () => 'result-2',
        reset: () => {}
      };
      (plugin as any).detectors = [detector1, detector2];
      
      const context = manager.getContext();
      
      await manager.use(plugin);
      
      expect(context.getDetector('detector-1')).toBe(detector1);
      expect(context.getDetector('detector-2')).toBe(detector2);
      
      await manager.remove('mock-plugin');
      
      expect(context.getDetector('detector-1')).toBeUndefined();
      expect(context.getDetector('detector-2')).toBeUndefined();
    });

    it('should handle event listeners properly during plugin lifecycle', async () => {
      const plugin = new MockPlugin();
      const context = manager.getContext();
      
      const installHandler = jest.fn();
      const errorHandler = jest.fn();
      const removeHandler = jest.fn();
      
      context.on('plugin:installed', installHandler);
      context.on('plugin:error', errorHandler);
      context.on('plugin:removed', removeHandler);
      
      // Test successful installation
      await manager.use(plugin);
      
      expect(installHandler).toHaveBeenCalledWith({ plugin });
      expect(errorHandler).not.toHaveBeenCalled();
      
      // Test successful removal
      await manager.remove('mock-plugin');
      
      expect(removeHandler).toHaveBeenCalledWith({ plugin });
      expect(errorHandler).toHaveBeenCalledTimes(0);
    });

    it('should emit error events with proper error context', async () => {
      const plugin = new MockPlugin();
      const installError = new Error('Custom install error');
      plugin.installError = installError;
      
      const context = manager.getContext();
      const errorHandler = jest.fn();
      
      context.on('plugin:error', errorHandler);
      
      await expect(manager.use(plugin)).rejects.toThrow('Failed to install plugin');
      
      expect(errorHandler).toHaveBeenCalledWith({
        plugin,
        error: installError
      });
    });
  });

  describe('singleton behavior', () => {
    it('should maintain same instance across multiple getInstance calls', () => {
      const instance1 = PluginManagerImpl.getInstance();
      const instance2 = PluginManagerImpl.getInstance();
      const instance3 = PluginManagerImpl.getInstance();
      
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
      expect(instance1).toBe(manager);
    });

    it('should preserve installed plugins across getInstance calls', async () => {
      const plugin = new MockPlugin();
      
      const manager1 = PluginManagerImpl.getInstance();
      await manager1.use(plugin);
      
      const manager2 = PluginManagerImpl.getInstance();
      
      expect(manager2.get('mock-plugin')).toBe(plugin);
      expect(manager1.getAll()).toEqual(manager2.getAll());
    });
  });
});