import { ContainerDetector } from '../../../src/detectors/container';
import * as os from 'os';
import * as fileUtils from '../../../src/utils/file';
import * as processUtils from '../../../src/utils/process';

jest.mock('os');
jest.mock('../../../src/utils/file');
jest.mock('../../../src/utils/process');

describe('ContainerDetector', () => {
  let detector: ContainerDetector;
  const mockOs = os as jest.Mocked<typeof os>;
  const mockFileUtils = fileUtils as jest.Mocked<typeof fileUtils>;
  const mockProcessUtils = processUtils as jest.Mocked<typeof processUtils>;

  beforeEach(() => {
    detector = new ContainerDetector({ cache: false });
    jest.clearAllMocks();
    
    // Default mocks
    mockOs.platform.mockReturnValue('linux');
    mockOs.hostname.mockReturnValue('localhost');
    mockFileUtils.fileExists.mockReturnValue(false);
    mockFileUtils.readFile.mockReturnValue(null);
    mockFileUtils.isDirectory.mockReturnValue(false);
    mockProcessUtils.getEnv.mockReturnValue(undefined);
    mockProcessUtils.hasEnv.mockReturnValue(false);
  });

  describe('Docker detection', () => {
    it('should detect Docker via .dockerenv file', () => {
      mockFileUtils.fileExists.mockImplementation((path) => path === '/.dockerenv');
      
      const result = detector.detect() as any;
      
      expect(result.isDocker).toBe(true);
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('docker');
    });

    it('should detect Docker via cgroup', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/self/cgroup') {
          return '12:memory:/docker/abc123';
        }
        return null;
      });
      
      const result = detector.detect() as any;
      
      expect(result.isDocker).toBe(true);
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('docker');
    });

    it('should detect Docker via containerd in cgroup', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/self/cgroup') {
          return '1:name=systemd:/containerd/abc123';
        }
        return null;
      });
      
      const result = detector.detect() as any;
      
      expect(result.isDocker).toBe(true);
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('docker');
    });
  });

  describe('WSL detection', () => {
    it('should not detect WSL on Windows', () => {
      mockOs.platform.mockReturnValue('win32');
      
      const result = detector.detect() as any;
      
      expect(result.isWSL).toBe(false);
    });

    it('should detect WSL via environment variable', () => {
      mockProcessUtils.getEnv.mockImplementation((key) => {
        if (key === 'WSL_DISTRO_NAME') return 'Ubuntu';
        return undefined;
      });
      
      const result = detector.detect() as any;
      
      expect(result.isWSL).toBe(true);
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('wsl');
      expect(result.wslDistro).toBe('Ubuntu');
    });

    it('should detect WSL via /proc/version', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/version') {
          return 'Linux version 4.4.0-19041-Microsoft (Microsoft@Microsoft.com)';
        }
        return null;
      });
      
      const result = detector.detect() as any;
      
      expect(result.isWSL).toBe(true);
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('wsl');
    });

    it('should detect WSL2 via kernel version', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/version') {
          return 'Linux version 5.10.16.3-microsoft-standard-WSL2';
        }
        return null;
      });
      
      const result = detector.detect() as any;
      
      expect(result.isWSL).toBe(true);
      expect(result.wslVersion).toBe(2);
      expect(result.containerType).toBe('wsl');
    });

    it('should detect WSL1 via kernel version', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/version') {
          return 'Linux version 4.4.0-19041-Microsoft';
        }
        return null;
      });
      
      const result = detector.detect() as any;
      
      expect(result.isWSL).toBe(true);
      expect(result.wslVersion).toBe(1);
      expect(result.containerType).toBe('wsl');
    });

    it('should detect WSL via WSLENV', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'WSLENV');
      
      const result = detector.detect() as any;
      
      expect(result.isWSL).toBe(true);
      expect(result.containerType).toBe('wsl');
    });
  });

  describe('Kubernetes detection', () => {
    it('should detect Kubernetes via service account directory', () => {
      mockFileUtils.isDirectory.mockImplementation((path) => 
        path === '/var/run/secrets/kubernetes.io'
      );
      
      const result = detector.detect() as any;
      
      expect(result.isKubernetes).toBe(true);
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('kubernetes');
    });

    it('should detect Kubernetes via environment variables', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'KUBERNETES_SERVICE_HOST'
      );
      
      const result = detector.detect() as any;
      
      expect(result.isKubernetes).toBe(true);
      expect(result.isContainer).toBe(true);
      expect(result.containerType).toBe('kubernetes');
    });

    it('should detect Kubernetes via hostname pattern and token file', () => {
      mockOs.hostname.mockReturnValue('pod-abc-def-123');
      mockFileUtils.fileExists.mockImplementation((path) => 
        path === '/var/run/secrets/kubernetes.io/serviceaccount/token'
      );
      
      const result = detector.detect() as any;
      
      expect(result.isKubernetes).toBe(true);
      expect(result.containerType).toBe('kubernetes');
    });
  });

  describe('No container detection', () => {
    it('should detect no container environment', () => {
      const result = detector.detect() as any;
      
      expect(result.isContainer).toBe(false);
      expect(result.isDocker).toBe(false);
      expect(result.isWSL).toBe(false);
      expect(result.isKubernetes).toBe(false);
      expect(result.containerType).toBeUndefined();
    });
  });

  describe('Multiple container types', () => {
    it('should prioritize Docker over other types', () => {
      mockFileUtils.fileExists.mockImplementation((path) => path === '/.dockerenv');
      mockProcessUtils.getEnv.mockImplementation((key) => {
        if (key === 'WSL_DISTRO_NAME') return 'Ubuntu';
        return undefined;
      });
      
      const result = detector.detect() as any;
      
      expect(result.containerType).toBe('docker');
      expect(result.isDocker).toBe(true);
      expect(result.isWSL).toBe(true);
    });
  });

  describe('WSL distro detection', () => {
    it('should get distro from os-release file', () => {
      mockProcessUtils.getEnv.mockImplementation((key) => {
        if (key === 'WSL_DISTRO_NAME') return undefined;
        return undefined;
      });
      
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/version') {
          return 'Linux version 5.10.16.3-microsoft-standard-WSL2';
        }
        if (path === '/etc/os-release') {
          return 'NAME="Ubuntu 20.04.3 LTS"\nVERSION="20.04.3 LTS"';
        }
        return null;
      });
      
      const result = detector.detect() as any;
      
      expect(result.isWSL).toBe(true);
      expect(result.wslDistro).toBe('Ubuntu 20.04.3 LTS');
    });
  });

  describe('WSL version detection edge cases', () => {
    it('should detect WSL 2 from kernel version 5.x with proper parsing', () => {
      mockFileUtils.readFile.mockImplementation((path) => {
        if (path === '/proc/version') {
          return 'Linux version 5.15.90.1-microsoft-standard with Microsoft kernel';
        }
        return null;
      });
      mockProcessUtils.getEnv.mockReturnValue(undefined);

      const result = detector.detect() as any;
      
      expect(result.isWSL).toBe(true);
      expect(result.wslVersion).toBe(2);
    });
  });
});