import { NodeDetector, EnvironmentModeDetector } from '../../../src/detectors/node';
import * as os from 'os';
import * as processUtils from '../../../src/utils/process';
import { Cache } from '../../../src/core/cache';

jest.mock('os');
jest.mock('../../../src/utils/process');

describe('NodeDetector', () => {
  let detector: NodeDetector;
  const mockOs = os as jest.Mocked<typeof os>;
  const mockProcessUtils = processUtils as jest.Mocked<typeof processUtils>;

  beforeEach(() => {
    detector = new NodeDetector({ cache: false });
    jest.clearAllMocks();
  });

  describe('performDetection', () => {
    it('should detect Node.js version and system info', () => {
      mockProcessUtils.parseNodeVersion.mockReturnValue({
        version: '18.16.0',
        major: 18,
        minor: 16,
        patch: 0,
      });
      mockOs.arch.mockReturnValue('x64');
      mockOs.platform.mockReturnValue('linux');

      const result = detector.detect() as any;

      expect(result).toEqual({
        version: '18.16.0',
        major: 18,
        minor: 16,
        patch: 0,
        arch: 'x64',
        platform: 'linux',
      });
    });

    it('should handle different architectures', () => {
      mockProcessUtils.parseNodeVersion.mockReturnValue({
        version: '20.0.0',
        major: 20,
        minor: 0,
        patch: 0,
      });
      mockOs.arch.mockReturnValue('arm64');
      mockOs.platform.mockReturnValue('darwin');

      const result = detector.detect() as any;

      expect(result.arch).toBe('arm64');
      expect(result.platform).toBe('darwin');
    });

    it('should handle Windows platform', () => {
      mockProcessUtils.parseNodeVersion.mockReturnValue({
        version: '16.20.2',
        major: 16,
        minor: 20,
        patch: 2,
      });
      mockOs.arch.mockReturnValue('ia32');
      mockOs.platform.mockReturnValue('win32');

      const result = detector.detect() as any;

      expect(result.arch).toBe('ia32');
      expect(result.platform).toBe('win32');
    });
  });
});

describe('EnvironmentModeDetector', () => {
  let detector: EnvironmentModeDetector;
  const mockProcessUtils = processUtils as jest.Mocked<typeof processUtils>;

  beforeEach(() => {
    detector = new EnvironmentModeDetector({ cache: false });
    jest.clearAllMocks();
    // Clear the cache to ensure test isolation
    Cache.getInstance().clear();
  });

  describe('performDetection', () => {
    it('should detect production mode', () => {
      mockProcessUtils.getEnv.mockReturnValue('production');

      const result = detector.detect();

      expect(result).toBe('production');
      expect(mockProcessUtils.getEnv).toHaveBeenCalledWith('NODE_ENV');
    });

    it('should detect development mode', () => {
      mockProcessUtils.getEnv.mockReturnValue('development');

      const result = detector.detect();

      expect(result).toBe('development');
    });

    it('should detect test mode', () => {
      mockProcessUtils.getEnv.mockReturnValue('test');

      const result = detector.detect();

      expect(result).toBe('test');
    });

    it('should detect staging mode', () => {
      mockProcessUtils.getEnv.mockReturnValue('staging');

      const result = detector.detect();

      expect(result).toBe('staging');
    });

    it('should handle uppercase NODE_ENV values', () => {
      mockProcessUtils.getEnv.mockReturnValue('PRODUCTION');

      const result = detector.detect();

      expect(result).toBe('production');
    });

    it('should handle mixed case NODE_ENV values', () => {
      mockProcessUtils.getEnv.mockReturnValue('Development');

      const result = detector.detect();

      expect(result).toBe('development');
    });

    it('should default to development when NODE_ENV is not set', () => {
      mockProcessUtils.getEnv.mockReturnValue(undefined);

      const result = detector.detect();

      expect(result).toBe('development');
    });

    it('should default to development for unknown NODE_ENV values', () => {
      mockProcessUtils.getEnv.mockReturnValue('custom-env');

      const result = detector.detect();

      expect(result).toBe('development');
    });

    it('should handle empty string NODE_ENV', () => {
      mockProcessUtils.getEnv.mockReturnValue('');

      const result = detector.detect();

      expect(result).toBe('development');
    });
  });

  describe('caching behavior', () => {
    it('should cache results when cache is enabled', () => {
      const cachedDetector = new EnvironmentModeDetector({ cache: true });
      mockProcessUtils.getEnv.mockReturnValue('production');

      const result1 = cachedDetector.detect();
      const result2 = cachedDetector.detect();

      expect(result1).toBe('production');
      expect(result2).toBe('production');
      expect(mockProcessUtils.getEnv).toHaveBeenCalledTimes(1);
    });

    it('should not cache results when cache is disabled', () => {
      mockProcessUtils.getEnv.mockReturnValue('production');

      const result1 = detector.detect();
      const result2 = detector.detect();

      expect(result1).toBe('production');
      expect(result2).toBe('production');
      expect(mockProcessUtils.getEnv).toHaveBeenCalledTimes(2);
    });
  });

  describe('reset functionality', () => {
    it('should clear cache on reset', () => {
      const cachedDetector = new EnvironmentModeDetector({ cache: true });
      mockProcessUtils.getEnv.mockReturnValueOnce('development').mockReturnValueOnce('production');

      const result1 = cachedDetector.detect();
      expect(result1).toBe('development');

      cachedDetector.reset();

      const result2 = cachedDetector.detect();
      expect(result2).toBe('production');
      expect(mockProcessUtils.getEnv).toHaveBeenCalledTimes(2);
    });
  });
});