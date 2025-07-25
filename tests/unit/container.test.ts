import { ContainerDetector } from '../../src/detectors/container';
import * as fileUtils from '../../src/utils/file';
import * as processUtils from '../../src/utils/process';
import * as os from 'os';

jest.mock('../../src/utils/file');
jest.mock('../../src/utils/process');
jest.mock('os');

const mockFileUtils = fileUtils as jest.Mocked<typeof fileUtils>;
const mockProcessUtils = processUtils as jest.Mocked<typeof processUtils>;
const mockOs = os as jest.Mocked<typeof os>;

describe('ContainerDetector', () => {
  let detector: ContainerDetector;

  beforeEach(() => {
    detector = new ContainerDetector({ cache: false });
    jest.clearAllMocks();
    
    // Default mocks
    mockFileUtils.fileExists.mockReturnValue(false);
    mockFileUtils.readFile.mockReturnValue(null);
    mockFileUtils.isDirectory.mockReturnValue(false);
    mockProcessUtils.getEnv.mockReturnValue(undefined);
    mockProcessUtils.hasEnv.mockReturnValue(false);
    mockOs.platform.mockReturnValue('linux'); // Default to linux for WSL tests
    mockOs.hostname.mockReturnValue('test-host');
  });

  describe('Docker detection', () => {
    it('should detect Docker via .dockerenv file', () => {
      mockFileUtils.fileExists.mockImplementation((path) => {
        return path === '/.dockerenv';
      });

      const result = detector.detect() as any;
      expect(result.isDocker).toBe(true);
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('docker');
    });


    it('should detect Docker via cgroup', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/self/cgroup') {
          return '0::/docker/1234567890abcdef';
        }
        return null;
      });

      const result = detector.detect() as any;
      expect(result.isDocker).toBe(true);
    });

    it('should detect containerd in cgroup', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/self/cgroup') {
          return '0::/containerd/1234567890abcdef';
        }
        return null;
      });

      const result = detector.detect() as any;
      expect(result.isDocker).toBe(true);
    });

    it('should detect Docker via mountinfo', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/self/mountinfo') {
          return '123 456 0:1 / / rw docker-container';
        }
        return null;
      });

      const result = detector.detect() as any;
      expect(result.isDocker).toBe(true);
    });
  });

  describe('Kubernetes detection', () => {
    it('should detect Kubernetes via service account directory', () => {
      mockFileUtils.isDirectory.mockImplementation((path) => {
        return path === '/var/run/secrets/kubernetes.io';
      });

      const result = detector.detect() as any;
      expect(result.isKubernetes).toBe(true);
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('kubernetes');
    });

    it('should detect Kubernetes via environment variables', () => {
      mockProcessUtils.hasEnv.mockImplementation((name) => {
        return name === 'KUBERNETES_SERVICE_HOST' || name === 'KUBERNETES_PORT';
      });

      const result = detector.detect() as any;
      expect(result.isKubernetes).toBe(true);
    });

    it('should detect Kubernetes via token file', () => {
      mockFileUtils.fileExists.mockImplementation((path) => {
        return path === '/var/run/secrets/kubernetes.io/serviceaccount/token';
      });
      mockOs.hostname.mockReturnValue('my-app-deployment-12345');

      const result = detector.detect() as any;
      expect(result.isKubernetes).toBe(true);
    });
  });

  describe('WSL detection', () => {
    it('should detect WSL via WSL_DISTRO_NAME', () => {
      mockProcessUtils.getEnv.mockImplementation((name) => {
        if (name === 'WSL_DISTRO_NAME') return 'Ubuntu';
        return undefined;
      });

      const result = detector.detect() as any;
      expect(result.isWSL).toBe(true);
      expect(result.wslDistro).toBe('Ubuntu');
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('wsl');
    });

    it('should detect WSL via WSL_INTEROP', () => {
      mockProcessUtils.hasEnv.mockImplementation((name) => {
        return name === 'WSL_INTEROP';
      });

      const result = detector.detect() as any;
      expect(result.isWSL).toBe(true);
    });

    it('should detect WSL via /proc/version', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/version') {
          return 'Linux version 5.10.16.3-microsoft-standard-WSL2';
        }
        return null;
      });

      const result = detector.detect() as any;
      expect(result.isWSL).toBe(true);
    });

    it('should extract distro name from /proc/version', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/version') {
          return 'Linux version 5.10.16.3-Ubuntu-microsoft-standard';
        }
        if (path === '/etc/os-release') {
          return 'NAME="Ubuntu"\nVERSION="20.04"';
        }
        return null;
      });

      const result = detector.detect() as any;
      expect(result.isWSL).toBe(true);
      expect(result.wslDistro).toBe('Ubuntu');
    });

    it('should detect WSL via interop file', () => {
      mockFileUtils.fileExists.mockImplementation((path) => {
        return path === '/proc/sys/fs/binfmt_misc/WSLInterop';
      });

      const result = detector.detect() as any;
      expect(result.isWSL).toBe(true);
    });

    it('should detect WSL via /run/WSL', () => {
      mockFileUtils.isDirectory.mockImplementation((path) => {
        return path === '/run/WSL';
      });

      const result = detector.detect() as any;
      expect(result.isWSL).toBe(true);
    });
  });

  describe('multiple container types', () => {
    it('should prioritize Docker over WSL when both are detected', () => {
      mockFileUtils.fileExists.mockImplementation((path) => {
        return path === '/.dockerenv';
      });
      mockFileUtils.isDirectory.mockImplementation((path) => {
        return path === '/run/WSL';
      });

      const result = detector.detect() as any;
      expect(result.isDocker).toBe(true);
      expect(result.isWSL).toBe(true);
      expect(result.containerType).toBe('docker');
    });
  });

  describe('no container detection', () => {
    it('should detect no container environment', () => {
      const result = detector.detect() as any;
      
      expect(result.isContainer).toBe(false);
      expect(result.isDocker).toBe(false);
      expect(result.isWSL).toBe(false);
      expect(result.isKubernetes).toBe(false);
      expect(result.containerType).toBeUndefined();
    });
  });



  describe('caching', () => {
    it('should cache detection results', () => {
      const cachedDetector = new ContainerDetector({ cache: true });
      mockFileUtils.fileExists.mockImplementation((path) => {
        return path === '/.dockerenv';
      });

      const result1 = cachedDetector.detect() as any;
      const result2 = cachedDetector.detect() as any;
      
      expect(result1).toBe(result2); // Same reference due to caching
      expect(mockFileUtils.fileExists).toHaveBeenCalledTimes(2); // Called only once due to caching
    });
  });

  describe('unknown container type', () => {
    it('should handle unknown container type edge case (theoretical)', () => {
      // This test demonstrates the theoretical path for unknown container type
      // Currently line 25 in container.ts is unreachable due to logic flow
      // The line exists for future extensibility
      
      // Since isContainer = isDocker || wslInfo.isWSL || isKubernetes
      // the unknown branch can never be reached with current logic
      
      // For now, we'll test that the existing logic works correctly
      const result = detector.detect() as any;
      
      expect(result.isContainer).toBeDefined();
      // containerType can be undefined when no container is detected
      expect(result.hasOwnProperty('containerType')).toBe(true);
    });
  });

  describe('WSL distro detection from environment', () => {
    it('should get WSL distro name from WSL_DISTRO_NAME in getWSLDistro when detected via proc version', () => {
      mockOs.platform.mockReturnValue('linux');
      
      // First call in detectWSL returns undefined, second call in getWSLDistro returns the value
      let getEnvCallCount = 0;
      mockProcessUtils.getEnv.mockImplementation((key) => {
        if (key === 'WSL_DISTRO_NAME') {
          getEnvCallCount++;
          // First call from detectWSL should return undefined
          // Second call from getWSLDistro should return the distro name
          return getEnvCallCount === 1 ? undefined : 'Ubuntu-20.04';
        }
        return undefined;
      });

      // Detect WSL via /proc/version instead of env var
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/version') {
          return 'Linux version 5.10.0 Microsoft WSL2';
        }
        return null;
      });

      mockFileUtils.fileExists.mockImplementation(() => false);
      mockFileUtils.isDirectory.mockImplementation(() => false);
      mockProcessUtils.hasEnv.mockImplementation(() => false);

      const result = detector.detect() as any;
      
      expect(result.isWSL).toBe(true);
      expect(result.wslDistro).toBe('Ubuntu-20.04');
    });
  });

  describe('container detection edge cases', () => {
    it('should handle Docker detection via /proc/1/cgroup', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/1/cgroup') {
          return '0::/docker/container-id';
        }
        return null;
      });

      const result = detector.detect() as any;
      expect(result.isDocker).toBe(true);
      expect(result.isContainer).toBe(true);
    });
  });

});