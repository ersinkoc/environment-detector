import * as pluginsIndex from '../../../src/plugins/index';
import { BasePlugin, PluginContextImpl } from '../../../src/plugins/base';
import { PluginManagerImpl } from '../../../src/plugins/manager';

describe('plugins/index', () => {
  it('should export BasePlugin', () => {
    expect(pluginsIndex.BasePlugin).toBe(BasePlugin);
  });

  it('should export PluginContextImpl', () => {
    expect(pluginsIndex.PluginContextImpl).toBe(PluginContextImpl);
  });

  it('should export PluginManagerImpl', () => {
    expect(pluginsIndex.PluginManagerImpl).toBe(PluginManagerImpl);
  });

  it('should export all classes', () => {
    const exports = Object.keys(pluginsIndex);
    expect(exports).toContain('BasePlugin');
    expect(exports).toContain('PluginContextImpl');
    expect(exports).toContain('PluginManagerImpl');
  });
});