import { VERSION, BUILD_DATE, NODE_VERSION } from '../../src/version';

describe('Version module', () => {
  describe('VERSION', () => {
    it('should export a version string', () => {
      expect(typeof VERSION).toBe('string');
      expect(VERSION).toBe('1.0.0');
    });

    it('should match semantic versioning format', () => {
      const semverRegex = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
      expect(VERSION).toMatch(semverRegex);
    });
  });

  describe('BUILD_DATE', () => {
    it('should export a valid ISO date string', () => {
      expect(typeof BUILD_DATE).toBe('string');
      expect(() => new Date(BUILD_DATE)).not.toThrow();
      
      const date = new Date(BUILD_DATE);
      expect(date.toISOString()).toBe(BUILD_DATE);
    });

    it('should be a recent date', () => {
      const buildDate = new Date(BUILD_DATE);
      const now = new Date();
      const daysDiff = (now.getTime() - buildDate.getTime()) / (1000 * 60 * 60 * 24);
      
      // Build date should be within reasonable range (e.g., not years old)
      expect(daysDiff).toBeGreaterThanOrEqual(0);
      expect(daysDiff).toBeLessThan(365); // Less than a year old
    });
  });

  describe('NODE_VERSION', () => {
    it('should export Node.js version', () => {
      expect(typeof NODE_VERSION).toBe('string');
      expect(NODE_VERSION).toBe(process.version);
    });

    it('should start with v prefix', () => {
      expect(NODE_VERSION).toMatch(/^v\d+\.\d+\.\d+/);
    });

    it('should match the current process version', () => {
      expect(NODE_VERSION).toBe(process.version);
    });
  });
});