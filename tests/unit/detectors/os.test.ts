import { OSDetector } from '../../../src/detectors/os';
import * as os from 'os';

jest.mock('os', () => ({
  platform: jest.fn(),
  release: jest.fn(),
  arch: jest.fn(),
  hostname: jest.fn(),
  version: jest.fn(),
}));

describe('OSDetector', () => {
  let detector: OSDetector;
  const mockOs = os as jest.Mocked<typeof os>;

  beforeEach(() => {
    detector = new OSDetector({ cache: false });
    jest.clearAllMocks();
  });

  describe('Windows detection', () => {
    beforeEach(() => {
      mockOs.platform.mockReturnValue('win32');
      mockOs.release.mockReturnValue('10.0.19044');
      mockOs.arch.mockReturnValue('x64');
      mockOs.version.mockReturnValue('Windows 10 Pro');
    });

    it('should detect Windows correctly', () => {
      const result = detector.detect() as any;
      
      expect(result.platform).toBe('win32');
      expect(result.type).toBe('windows');
      expect(result.isWindows).toBe(true);
      expect(result.isMacOS).toBe(false);
      expect(result.isLinux).toBe(false);
      expect(result.arch).toBe('x64');
      expect(result.version).toBe('Windows 10 Pro');
      expect(result.release).toBe('10.0.19044');
    });
  });

  describe('macOS detection', () => {
    beforeEach(() => {
      mockOs.platform.mockReturnValue('darwin');
      mockOs.release.mockReturnValue('21.6.0');
      mockOs.arch.mockReturnValue('arm64');
      mockOs.version.mockReturnValue('Darwin Kernel Version 21.6.0');
    });

    it('should detect macOS correctly', () => {
      const result = detector.detect() as any;
      
      expect(result.platform).toBe('darwin');
      expect(result.type).toBe('macos');
      expect(result.isWindows).toBe(false);
      expect(result.isMacOS).toBe(true);
      expect(result.isLinux).toBe(false);
      expect(result.arch).toBe('arm64');
      expect(result.version).toBe('Darwin Kernel Version 21.6.0');
      expect(result.release).toBe('21.6.0');
    });
  });

  describe('Linux detection', () => {
    beforeEach(() => {
      mockOs.platform.mockReturnValue('linux');
      mockOs.release.mockReturnValue('5.15.0-56-generic');
      mockOs.arch.mockReturnValue('x64');
      mockOs.version.mockReturnValue('Linux version 5.15.0');
    });

    it('should detect Linux correctly', () => {
      const result = detector.detect() as any;
      
      expect(result.platform).toBe('linux');
      expect(result.type).toBe('linux');
      expect(result.isWindows).toBe(false);
      expect(result.isMacOS).toBe(false);
      expect(result.isLinux).toBe(true);
      expect(result.arch).toBe('x64');
      expect(result.version).toBe('Linux version 5.15.0');
      expect(result.release).toBe('5.15.0-56-generic');
    });

  });

  describe('Unknown platform', () => {
    beforeEach(() => {
      mockOs.platform.mockReturnValue('freebsd' as any);
      mockOs.release.mockReturnValue('13.1-RELEASE');
      mockOs.arch.mockReturnValue('x64');
      mockOs.version.mockReturnValue(undefined as any);
    });

    it('should handle unknown platforms', () => {
      const result = detector.detect() as any;
      
      expect(result.platform).toBe('freebsd');
      expect(result.type).toBe('unknown');
      expect(result.isWindows).toBe(false);
      expect(result.isMacOS).toBe(false);
      expect(result.isLinux).toBe(false);
    });
  });

  describe('caching', () => {
    it('should cache results when enabled', () => {
      const cachedDetector = new OSDetector({ cache: true });
      mockOs.platform.mockReturnValue('linux');
      mockOs.release.mockReturnValue('5.15.0');
      mockOs.arch.mockReturnValue('x64');
      
      const result1 = cachedDetector.detect() as any;
      const result2 = cachedDetector.detect() as any;
      
      expect(result1).toBe(result2);
      expect(mockOs.platform).toHaveBeenCalledTimes(1);
    });

    it('should not cache results when disabled', () => {
      mockOs.platform.mockReturnValue('linux');
      mockOs.release.mockReturnValue('5.15.0');
      mockOs.arch.mockReturnValue('x64');
      
      const result1 = detector.detect() as any;
      const result2 = detector.detect() as any;
      
      expect(result1).toEqual(result2);
      expect(mockOs.platform).toHaveBeenCalledTimes(2);
    });
  });
});