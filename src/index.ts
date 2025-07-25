import type { EnvironmentInfo, DetectorOptions } from './types';
import { OSDetector } from './detectors/os';
import { ContainerDetector } from './detectors/container';
import { CIDetector } from './detectors/ci';
import { CloudDetector } from './detectors/cloud';
import { NodeDetector, EnvironmentModeDetector } from './detectors/node';
import { PrivilegeDetector } from './detectors/privileges';
import { PluginManagerImpl } from './plugins/manager';
import { Cache } from './core/cache';
import { VERSION } from './version';

class EnvironmentDetector {
  private osDetector = new OSDetector();
  private containerDetector = new ContainerDetector();
  private ciDetector = new CIDetector();
  private cloudDetector = new CloudDetector();
  private nodeDetector = new NodeDetector();
  private modeDetector = new EnvironmentModeDetector();
  private privilegeDetector = new PrivilegeDetector();
  private pluginManager = PluginManagerImpl.getInstance();
  private cache = Cache.getInstance();

  constructor(options?: DetectorOptions) {
    if (options) {
      this.osDetector = new OSDetector(options);
      this.containerDetector = new ContainerDetector(options);
      this.ciDetector = new CIDetector(options);
      this.cloudDetector = new CloudDetector(options);
      this.nodeDetector = new NodeDetector(options);
      this.modeDetector = new EnvironmentModeDetector(options);
      this.privilegeDetector = new PrivilegeDetector(options);

      if (options.cache === false) {
        this.cache.disable();
      }
    }
  }

  public getEnvironmentInfo(): EnvironmentInfo {
    return {
      os: this.osDetector.detect() as any,
      container: this.containerDetector.detect() as any,
      ci: this.ciDetector.detect() as any,
      cloud: this.cloudDetector.detect() as any,
      node: this.nodeDetector.detect() as any,
      privileges: this.privilegeDetector.detect() as any,
      mode: this.modeDetector.detect() as any,
    };
  }

  public async getEnvironmentInfoAsync(): Promise<EnvironmentInfo> {
    const [os, container, ci, cloud, node, privileges, mode] = await Promise.all([
      Promise.resolve(this.osDetector.detect()),
      Promise.resolve(this.containerDetector.detect()),
      Promise.resolve(this.ciDetector.detect()),
      Promise.resolve(this.cloudDetector.detect()),
      Promise.resolve(this.nodeDetector.detect()),
      Promise.resolve(this.privilegeDetector.detect()),
      Promise.resolve(this.modeDetector.detect()),
    ]);

    return { os, container, ci, cloud, node, privileges, mode };
  }

  // Convenience getters for individual detections
  public get isWindows(): boolean {
    return (this.osDetector.detect() as any).isWindows;
  }

  public get isMacOS(): boolean {
    return (this.osDetector.detect() as any).isMacOS;
  }

  public get isLinux(): boolean {
    return (this.osDetector.detect() as any).isLinux;
  }

  public get isWSL(): boolean {
    return (this.containerDetector.detect() as any).isWSL;
  }

  public get isDocker(): boolean {
    return (this.containerDetector.detect() as any).isDocker;
  }

  public get isKubernetes(): boolean {
    return (this.containerDetector.detect() as any).isKubernetes;
  }

  public get isContainer(): boolean {
    return (this.containerDetector.detect() as any).isContainer;
  }

  public get isCI(): boolean {
    return (this.ciDetector.detect() as any).isCI;
  }

  public get isCloud(): boolean {
    return (this.cloudDetector.detect() as any).isCloud;
  }

  public get isServerless(): boolean {
    return (this.cloudDetector.detect() as any).isServerless;
  }

  public get isElevated(): boolean {
    return (this.privilegeDetector.detect() as any).isElevated;
  }

  public get isRoot(): boolean {
    return (this.privilegeDetector.detect() as any).isRoot;
  }

  public get isAdmin(): boolean {
    return (this.privilegeDetector.detect() as any).isAdmin;
  }

  // Plugin system
  public use(plugin: any): void {
    this.pluginManager.use(plugin);
  }

  public removePlugin(pluginName: string): void {
    this.pluginManager.remove(pluginName);
  }

  // Cache management
  public clearCache(): void {
    this.cache.clear();
  }

  public enableCache(): void {
    this.cache.enable();
  }

  public disableCache(): void {
    this.cache.disable();
  }

  // Reset all detectors
  public reset(): void {
    this.osDetector.reset();
    this.containerDetector.reset();
    this.ciDetector.reset();
    this.cloudDetector.reset();
    this.nodeDetector.reset();
    this.modeDetector.reset();
    this.privilegeDetector.reset();
  }

  // Get version information
  public getVersion(): string {
    return VERSION;
  }

  // Get detailed package information
  public getPackageInfo(): { version: string; detectors: string[]; cacheEnabled: boolean } {
    return {
      version: VERSION,
      detectors: ['os', 'container', 'ci', 'cloud', 'node', 'privileges', 'mode'],
      cacheEnabled: this.cache.isEnabled(),
    };
  }

  // Quick environment summary
  public getEnvironmentSummary(): string {
    const info = this.getEnvironmentInfo();
    const parts: string[] = [info.os.type];
    
    if (info.container.isContainer) {
      parts.push(info.container.containerType || 'container');
    }
    
    if (info.ci.isCI) {
      parts.push('ci');
    }
    
    if (info.cloud.isCloud) {
      parts.push('cloud');
    }
    
    if (info.privileges.isElevated) {
      parts.push('elevated');
    }
    
    return parts.join('+');
  }
}

// Create default instance
const env = new EnvironmentDetector();

// Export default instance and class
export default env;
export { EnvironmentDetector };

// Export types
export type * from './types';
export type * from './types/plugin';

// Export plugin system
export * from './plugins';

// Export core classes for advanced usage
export { BaseDetector } from './core/detector';
export { Cache } from './core/cache';

// Export version
export { VERSION } from './version';