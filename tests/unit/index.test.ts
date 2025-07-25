import env, { EnvironmentDetector, BaseDetector, Cache, VERSION } from '../../src/index';
import { OSDetector } from '../../src/detectors/os';
import { ContainerDetector } from '../../src/detectors/container';
import { CIDetector } from '../../src/detectors/ci';
import { CloudDetector } from '../../src/detectors/cloud';
import { NodeDetector, EnvironmentModeDetector } from '../../src/detectors/node';
import { PrivilegeDetector } from '../../src/detectors/privileges';
import { PluginManagerImpl } from '../../src/plugins/manager';
import type { Plugin } from '../../src/types/plugin';

// Mock all detector modules
jest.mock('../../src/detectors/os');
jest.mock('../../src/detectors/container');
jest.mock('../../src/detectors/ci');
jest.mock('../../src/detectors/cloud');
jest.mock('../../src/detectors/node');
jest.mock('../../src/detectors/privileges');
jest.mock('../../src/plugins/manager');
jest.mock('../../src/core/cache');
jest.mock('../../src/version', () => ({ VERSION: '1.0.0' }));

describe('EnvironmentDetector', () => {
  let detector: EnvironmentDetector;
  
  // Mock detector instances
  const mockOSDetector = {
    detect: jest.fn().mockReturnValue({
      platform: 'linux',
      type: 'linux',
      isWindows: false,
      isMacOS: false,
      isLinux: true,
    }),
    reset: jest.fn(),
  };
  
  const mockContainerDetector = {
    detect: jest.fn().mockReturnValue({
      isContainer: false,
      isDocker: false,
      isKubernetes: false,
      isWSL: false,
    }),
    reset: jest.fn(),
  };
  
  const mockCIDetector = {
    detect: jest.fn().mockReturnValue({
      isCI: false,
    }),
    reset: jest.fn(),
  };
  
  const mockCloudDetector = {
    detect: jest.fn().mockReturnValue({
      isCloud: false,
      isServerless: false,
    }),
    reset: jest.fn(),
  };
  
  const mockNodeDetector = {
    detect: jest.fn().mockReturnValue({
      version: '18.0.0',
      major: 18,
      minor: 0,
      patch: 0,
    }),
    reset: jest.fn(),
  };
  
  const mockModeDetector = {
    detect: jest.fn().mockReturnValue('development'),
    reset: jest.fn(),
  };
  
  const mockPrivilegeDetector = {
    detect: jest.fn().mockReturnValue({
      isElevated: false,
      isRoot: false,
      isAdmin: false,
    }),
    reset: jest.fn(),
  };
  
  const mockPluginManager = {
    use: jest.fn(),
    remove: jest.fn(),
    getInstance: jest.fn(),
  };
  
  const mockCache = {
    clear: jest.fn(),
    enable: jest.fn(),
    disable: jest.fn(),
    isEnabled: jest.fn().mockReturnValue(true),
    getInstance: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup constructor mocks
    (OSDetector as jest.MockedClass<typeof OSDetector>).mockImplementation(() => mockOSDetector as any);
    (ContainerDetector as jest.MockedClass<typeof ContainerDetector>).mockImplementation(() => mockContainerDetector as any);
    (CIDetector as jest.MockedClass<typeof CIDetector>).mockImplementation(() => mockCIDetector as any);
    (CloudDetector as jest.MockedClass<typeof CloudDetector>).mockImplementation(() => mockCloudDetector as any);
    (NodeDetector as jest.MockedClass<typeof NodeDetector>).mockImplementation(() => mockNodeDetector as any);
    (EnvironmentModeDetector as jest.MockedClass<typeof EnvironmentModeDetector>).mockImplementation(() => mockModeDetector as any);
    (PrivilegeDetector as jest.MockedClass<typeof PrivilegeDetector>).mockImplementation(() => mockPrivilegeDetector as any);
    (PluginManagerImpl.getInstance as jest.Mock).mockReturnValue(mockPluginManager);
    (Cache.getInstance as jest.Mock).mockReturnValue(mockCache);
    
    detector = new EnvironmentDetector();
  });

  describe('constructor', () => {
    it('should create detector instances with default options', () => {
      expect(OSDetector).toHaveBeenCalledWith();
      expect(ContainerDetector).toHaveBeenCalledWith();
      expect(CIDetector).toHaveBeenCalledWith();
      expect(CloudDetector).toHaveBeenCalledWith();
      expect(NodeDetector).toHaveBeenCalledWith();
      expect(EnvironmentModeDetector).toHaveBeenCalledWith();
      expect(PrivilegeDetector).toHaveBeenCalledWith();
    });

    it('should pass options to all detectors', () => {
      const options = { cache: true, cacheTimeout: 5000 };
      new EnvironmentDetector(options);
      
      expect(OSDetector).toHaveBeenCalledWith(options);
      expect(ContainerDetector).toHaveBeenCalledWith(options);
      expect(CIDetector).toHaveBeenCalledWith(options);
      expect(CloudDetector).toHaveBeenCalledWith(options);
      expect(NodeDetector).toHaveBeenCalledWith(options);
      expect(EnvironmentModeDetector).toHaveBeenCalledWith(options);
      expect(PrivilegeDetector).toHaveBeenCalledWith(options);
    });

    it('should disable cache when cache option is false', () => {
      new EnvironmentDetector({ cache: false });
      
      expect(mockCache.disable).toHaveBeenCalled();
    });
  });

  describe('getEnvironmentInfo', () => {
    it('should return complete environment information', () => {
      const result = detector.getEnvironmentInfo();
      
      expect(result).toEqual({
        os: mockOSDetector.detect(),
        container: mockContainerDetector.detect(),
        ci: mockCIDetector.detect(),
        cloud: mockCloudDetector.detect(),
        node: mockNodeDetector.detect(),
        privileges: mockPrivilegeDetector.detect(),
        mode: mockModeDetector.detect(),
      });
    });

    it('should call detect on all detectors', () => {
      detector.getEnvironmentInfo();
      
      expect(mockOSDetector.detect).toHaveBeenCalled();
      expect(mockContainerDetector.detect).toHaveBeenCalled();
      expect(mockCIDetector.detect).toHaveBeenCalled();
      expect(mockCloudDetector.detect).toHaveBeenCalled();
      expect(mockNodeDetector.detect).toHaveBeenCalled();
      expect(mockPrivilegeDetector.detect).toHaveBeenCalled();
      expect(mockModeDetector.detect).toHaveBeenCalled();
    });
  });

  describe('getEnvironmentInfoAsync', () => {
    it('should return complete environment information asynchronously', async () => {
      const result = await detector.getEnvironmentInfoAsync();
      
      expect(result).toEqual({
        os: mockOSDetector.detect(),
        container: mockContainerDetector.detect(),
        ci: mockCIDetector.detect(),
        cloud: mockCloudDetector.detect(),
        node: mockNodeDetector.detect(),
        privileges: mockPrivilegeDetector.detect(),
        mode: mockModeDetector.detect(),
      });
    });

    it('should handle async detectors', async () => {
      mockOSDetector.detect.mockReturnValue(Promise.resolve({ platform: 'win32' }));
      
      const result = await detector.getEnvironmentInfoAsync();
      
      expect(result.os).toEqual({ platform: 'win32' });
    });
  });

  describe('convenience getters', () => {
    it('should provide isWindows getter', () => {
      mockOSDetector.detect.mockReturnValue({ isWindows: true });
      expect(detector.isWindows).toBe(true);
    });

    it('should provide isMacOS getter', () => {
      mockOSDetector.detect.mockReturnValue({ isMacOS: true });
      expect(detector.isMacOS).toBe(true);
    });

    it('should provide isLinux getter', () => {
      mockOSDetector.detect.mockReturnValue({ isLinux: true });
      expect(detector.isLinux).toBe(true);
    });

    it('should provide isWSL getter', () => {
      mockContainerDetector.detect.mockReturnValue({ isWSL: true });
      expect(detector.isWSL).toBe(true);
    });

    it('should provide isDocker getter', () => {
      mockContainerDetector.detect.mockReturnValue({ isDocker: true });
      expect(detector.isDocker).toBe(true);
    });

    it('should provide isKubernetes getter', () => {
      mockContainerDetector.detect.mockReturnValue({ isKubernetes: true });
      expect(detector.isKubernetes).toBe(true);
    });

    it('should provide isContainer getter', () => {
      mockContainerDetector.detect.mockReturnValue({ isContainer: true });
      expect(detector.isContainer).toBe(true);
    });

    it('should provide isCI getter', () => {
      mockCIDetector.detect.mockReturnValue({ isCI: true });
      expect(detector.isCI).toBe(true);
    });

    it('should provide isCloud getter', () => {
      mockCloudDetector.detect.mockReturnValue({ isCloud: true });
      expect(detector.isCloud).toBe(true);
    });

    it('should provide isServerless getter', () => {
      mockCloudDetector.detect.mockReturnValue({ isServerless: true });
      expect(detector.isServerless).toBe(true);
    });

    it('should provide isElevated getter', () => {
      mockPrivilegeDetector.detect.mockReturnValue({ isElevated: true });
      expect(detector.isElevated).toBe(true);
    });

    it('should provide isRoot getter', () => {
      mockPrivilegeDetector.detect.mockReturnValue({ isRoot: true });
      expect(detector.isRoot).toBe(true);
    });

    it('should provide isAdmin getter', () => {
      mockPrivilegeDetector.detect.mockReturnValue({ isAdmin: true });
      expect(detector.isAdmin).toBe(true);
    });
  });

  describe('plugin system', () => {
    it('should use plugin', () => {
      const plugin: Plugin = { name: 'test', version: '1.0.0', detectors: [] };
      
      detector.use(plugin);
      
      expect(mockPluginManager.use).toHaveBeenCalledWith(plugin);
    });

    it('should remove plugin', () => {
      detector.removePlugin('test-plugin');
      
      expect(mockPluginManager.remove).toHaveBeenCalledWith('test-plugin');
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      detector.clearCache();
      
      expect(mockCache.clear).toHaveBeenCalled();
    });

    it('should enable cache', () => {
      detector.enableCache();
      
      expect(mockCache.enable).toHaveBeenCalled();
    });

    it('should disable cache', () => {
      detector.disableCache();
      
      expect(mockCache.disable).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all detectors', () => {
      detector.reset();
      
      expect(mockOSDetector.reset).toHaveBeenCalled();
      expect(mockContainerDetector.reset).toHaveBeenCalled();
      expect(mockCIDetector.reset).toHaveBeenCalled();
      expect(mockCloudDetector.reset).toHaveBeenCalled();
      expect(mockNodeDetector.reset).toHaveBeenCalled();
      expect(mockModeDetector.reset).toHaveBeenCalled();
      expect(mockPrivilegeDetector.reset).toHaveBeenCalled();
    });
  });

  describe('version information', () => {
    it('should return version', () => {
      expect(detector.getVersion()).toBe('1.0.0');
    });

    it('should return package info', () => {
      const info = detector.getPackageInfo();
      
      expect(info).toEqual({
        version: '1.0.0',
        detectors: ['os', 'container', 'ci', 'cloud', 'node', 'privileges', 'mode'],
        cacheEnabled: true,
      });
    });
  });

  describe('getEnvironmentSummary', () => {
    it('should return basic summary', () => {
      mockOSDetector.detect.mockReturnValue({ type: 'linux' });
      mockContainerDetector.detect.mockReturnValue({ isContainer: false });
      mockCIDetector.detect.mockReturnValue({ isCI: false });
      mockCloudDetector.detect.mockReturnValue({ isCloud: false });
      mockPrivilegeDetector.detect.mockReturnValue({ isElevated: false });
      
      expect(detector.getEnvironmentSummary()).toBe('linux');
    });

    it('should include container info in summary', () => {
      mockOSDetector.detect.mockReturnValue({ type: 'linux' });
      mockContainerDetector.detect.mockReturnValue({ 
        isContainer: true,
        containerType: 'docker'
      });
      
      expect(detector.getEnvironmentSummary()).toBe('linux+docker');
    });

    it('should include generic container in summary when type unknown', () => {
      mockOSDetector.detect.mockReturnValue({ type: 'linux' });
      mockContainerDetector.detect.mockReturnValue({ 
        isContainer: true,
        containerType: undefined
      });
      
      expect(detector.getEnvironmentSummary()).toBe('linux+container');
    });

    it('should include all environment flags in summary', () => {
      mockOSDetector.detect.mockReturnValue({ type: 'windows' });
      mockContainerDetector.detect.mockReturnValue({ 
        isContainer: true,
        containerType: 'wsl'
      });
      mockCIDetector.detect.mockReturnValue({ isCI: true });
      mockCloudDetector.detect.mockReturnValue({ isCloud: true });
      mockPrivilegeDetector.detect.mockReturnValue({ isElevated: true });
      
      expect(detector.getEnvironmentSummary()).toBe('windows+wsl+ci+cloud+elevated');
    });
  });
});

describe('module exports', () => {
  it('should export default instance', () => {
    expect(env).toBeInstanceOf(EnvironmentDetector);
  });

  it('should export EnvironmentDetector class', () => {
    expect(EnvironmentDetector).toBeDefined();
  });

  it('should export BaseDetector', () => {
    expect(BaseDetector).toBeDefined();
  });

  it('should export Cache', () => {
    expect(Cache).toBeDefined();
  });

  it('should export VERSION', () => {
    expect(VERSION).toBe('1.0.0');
  });
});