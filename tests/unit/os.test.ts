import * as os from 'os';
import { OSDetector } from '../../src/detectors/os';

jest.mock('os', () => ({
  platform: jest.fn(),
  release: jest.fn(),
  arch: jest.fn(),
  hostname: jest.fn(),
  version: jest.fn(),
}));
const mockOs = os as jest.Mocked<typeof os>;

describe('OSDetector', () => {
  let detector: OSDetector;

  beforeEach(() => {
    detector = new OSDetector();
    detector.reset(); // Reset cache
    jest.clearAllMocks();
  });

  describe('performDetection', () => {
    it('should detect Windows correctly', () => {
      mockOs.platform.mockReturnValue('win32');
      mockOs.arch.mockReturnValue('x64');
      mockOs.release.mockReturnValue('10.0.19041');
      mockOs.version.mockReturnValue('Windows 10 Pro');

      const result = detector.detect() as any;
      
      expect(result).toEqual({
        platform: 'win32',
        type: 'windows',
        arch: 'x64',
        release: '10.0.19041',
        version: 'Windows 10 Pro',
        isWindows: true,
        isMacOS: false,
        isLinux: false,
      });
    });

    it('should detect macOS correctly', () => {
      mockOs.platform.mockReturnValue('darwin');
      mockOs.arch.mockReturnValue('x64');
      mockOs.release.mockReturnValue('20.3.0');
      mockOs.version.mockReturnValue('Darwin Kernel Version 20.3.0');

      const result = detector.detect() as any;
      
      expect(result).toEqual({
        platform: 'darwin',
        type: 'macos',
        arch: 'x64',
        release: '20.3.0',
        version: 'Darwin Kernel Version 20.3.0',
        isWindows: false,
        isMacOS: true,
        isLinux: false,
      });
    });

    it('should detect Linux correctly', () => {
      mockOs.platform.mockReturnValue('linux');
      mockOs.arch.mockReturnValue('x64');
      mockOs.release.mockReturnValue('5.10.0-8-amd64');
      mockOs.version.mockReturnValue('#1 SMP Debian 5.10.46-4');

      const result = detector.detect() as any;
      
      expect(result).toEqual({
        platform: 'linux',
        type: 'linux',
        arch: 'x64',
        release: '5.10.0-8-amd64',
        version: '#1 SMP Debian 5.10.46-4',
        isWindows: false,
        isMacOS: false,
        isLinux: true,
      });
    });

    it('should use cached values on second call', () => {
      mockOs.platform.mockReturnValue('win32');
      mockOs.arch.mockReturnValue('x64');
      mockOs.release.mockReturnValue('10.0.19041');
      mockOs.version.mockReturnValue('Windows 10 Pro');

      // First call
      const result1 = detector.detect() as any;

      // Second call should use cache
      const result2 = detector.detect() as any;
      expect(result2).toEqual(result1);
      
      // OS methods should only be called once due to caching
      expect(mockOs.platform).toHaveBeenCalledTimes(1);
    });
  });


  describe('error handling', () => {
    it('should return default values when detection fails', () => {
      mockOs.platform.mockImplementation(() => {
        throw new Error('Platform detection failed');
      });

      const result = detector.detect() as any;
      expect(result).toEqual({
        platform: 'linux',
        type: 'unknown',
        arch: 'unknown',
        release: 'unknown',
        version: 'unknown',
        isWindows: false,
        isMacOS: false,
        isLinux: false,
      });
    });
  });
});