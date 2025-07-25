import { BasePlugin, PluginContextImpl } from '../../../src/plugins/base';
import type { Detector } from '../../../src/types';
import type { PluginContext } from '../../../src/types/plugin';

// Create a concrete plugin implementation for testing
class TestPlugin extends BasePlugin {
  public readonly name = 'test-plugin';
  public readonly version = '1.0.0';
  public override description = 'Test plugin for unit tests';
  public detectors: Detector[] = [];

  public installCalled = false;
  public uninstallCalled = false;
  public installContext?: PluginContext;

  protected override async onInstall(context: PluginContext): Promise<void> {
    this.installCalled = true;
    this.installContext = context;
  }

  protected override async onUninstall(): Promise<void> {
    this.uninstallCalled = true;
  }
}

// Mock detector for testing
class MockDetector implements Detector {
  public name = 'mock-detector';
  public detect() {
    return 'mock-result';
  }
  public reset() {}
}

describe('BasePlugin', () => {
  let plugin: TestPlugin;
  let context: PluginContextImpl;

  beforeEach(() => {
    plugin = new TestPlugin();
    context = new PluginContextImpl();
  });

  describe('install', () => {
    it('should register all detectors from the plugin', async () => {
      const detector1 = new MockDetector();
      const detector2 = new MockDetector();
      detector2.name = 'mock-detector-2';
      
      plugin.detectors = [detector1, detector2];
      
      await plugin.install(context);
      
      expect(context.getDetector('mock-detector')).toBe(detector1);
      expect(context.getDetector('mock-detector-2')).toBe(detector2);
    });

    it('should call onInstall hook with context', async () => {
      await plugin.install(context);
      
      expect(plugin.installCalled).toBe(true);
      expect(plugin.installContext).toBe(context);
    });

    it('should work without onInstall hook', async () => {
      class MinimalPlugin extends BasePlugin {
        public readonly name = 'minimal';
        public readonly version = '1.0.0';
        public readonly detectors: Detector[] = [];
      }
      
      const minimalPlugin = new MinimalPlugin();
      
      await expect(minimalPlugin.install(context)).resolves.not.toThrow();
    });
  });

  describe('uninstall', () => {
    it('should call onUninstall hook', async () => {
      await plugin.uninstall();
      
      expect(plugin.uninstallCalled).toBe(true);
    });

    it('should work without onUninstall hook', async () => {
      class MinimalPlugin extends BasePlugin {
        public readonly name = 'minimal';
        public readonly version = '1.0.0';
        public readonly detectors: Detector[] = [];
      }
      
      const minimalPlugin = new MinimalPlugin();
      
      await expect(minimalPlugin.uninstall()).resolves.not.toThrow();
    });
  });
});

describe('PluginContextImpl', () => {
  let context: PluginContextImpl;

  beforeEach(() => {
    context = new PluginContextImpl();
  });

  describe('detector management', () => {
    it('should register and retrieve detectors', () => {
      const detector = new MockDetector();
      
      context.registerDetector(detector);
      
      expect(context.getDetector('mock-detector')).toBe(detector);
    });

    it('should unregister detectors', () => {
      const detector = new MockDetector();
      context.registerDetector(detector);
      
      context.unregisterDetector('mock-detector');
      
      expect(context.getDetector('mock-detector')).toBeUndefined();
    });

    it('should get all detectors', () => {
      const detector1 = new MockDetector();
      const detector2 = new MockDetector();
      detector2.name = 'mock-detector-2';
      
      context.registerDetector(detector1);
      context.registerDetector(detector2);
      
      const all = context.getAllDetectors();
      expect(all).toHaveLength(2);
      expect(all).toContain(detector1);
      expect(all).toContain(detector2);
    });

    it('should return undefined for non-existent detector', () => {
      expect(context.getDetector('non-existent')).toBeUndefined();
    });

    it('should overwrite existing detector with same name', () => {
      const detector1 = new MockDetector();
      const detector2 = new MockDetector();
      
      context.registerDetector(detector1);
      context.registerDetector(detector2);
      
      expect(context.getDetector('mock-detector')).toBe(detector2);
    });
  });

  describe('event handling', () => {
    it('should register and emit events', () => {
      const handler = jest.fn();
      
      context.on('test-event', handler);
      context.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should handle multiple handlers for same event', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      context.on('test-event', handler1);
      context.on('test-event', handler2);
      context.emit('test-event', 'data');
      
      expect(handler1).toHaveBeenCalledWith('data');
      expect(handler2).toHaveBeenCalledWith('data');
    });

    it('should remove event handlers', () => {
      const handler = jest.fn();
      
      context.on('test-event', handler);
      context.off('test-event', handler);
      context.emit('test-event');
      
      expect(handler).not.toHaveBeenCalled();
    });

    it('should not throw when emitting event with no handlers', () => {
      expect(() => context.emit('no-handlers')).not.toThrow();
    });

    it('should handle sync handler errors gracefully', () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = jest.fn();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      context.on('test-event', errorHandler);
      context.on('test-event', normalHandler);
      
      context.emit('test-event');
      
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        "Error in event handler for 'test-event':",
        expect.any(Error)
      );
      
      consoleError.mockRestore();
    });

    it('should handle async handler errors gracefully', async () => {
      const errorHandler = jest.fn(async () => {
        throw new Error('Async handler error');
      });
      const normalHandler = jest.fn();
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      
      context.on('test-event', errorHandler);
      context.on('test-event', normalHandler);
      
      context.emit('test-event');
      
      // Wait for async error to be caught
      await new Promise(resolve => setTimeout(resolve, 10));
      
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        "Error in event handler for 'test-event':",
        expect.any(Error)
      );
      
      consoleError.mockRestore();
    });

    it('should handle removing non-existent handler', () => {
      const handler = jest.fn();
      
      expect(() => context.off('test-event', handler)).not.toThrow();
    });

    it('should handle removing handler from empty handler list', () => {
      const handler = jest.fn();
      context.on('test-event', handler);
      context.off('test-event', handler);
      
      // Try to remove again
      expect(() => context.off('test-event', handler)).not.toThrow();
    });

    it('should only remove specific handler instance', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      context.on('test-event', handler1);
      context.on('test-event', handler2);
      context.on('test-event', handler1); // Add same handler again
      
      context.off('test-event', handler1); // Should only remove first instance
      context.emit('test-event');
      
      expect(handler1).toHaveBeenCalledTimes(1); // Still called once
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });
});