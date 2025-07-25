import env, { EnvironmentDetector } from '../../src/index';

describe('Full Environment Detection Integration', () => {
  describe('Real environment detection', () => {
    it('should detect current environment without errors', () => {
      expect(() => {
        const info = env.getEnvironmentInfo();
        
        // Basic structure validation
        expect(info).toBeDefined();
        expect(info.os).toBeDefined();
        expect(info.container).toBeDefined();
        expect(info.ci).toBeDefined();
        expect(info.cloud).toBeDefined();
        expect(info.node).toBeDefined();
        expect(info.privileges).toBeDefined();
        expect(info.mode).toBeDefined();
      }).not.toThrow();
    });

    it('should detect Node.js version correctly', () => {
      const info = env.getEnvironmentInfo();
      
      expect(info.node.version).toMatch(/^v\d+\.\d+\.\d+/);
      expect(info.node.major).toBeGreaterThan(0);
      expect(info.node.minor).toBeGreaterThanOrEqual(0);
      expect(info.node.patch).toBeGreaterThanOrEqual(0);
      expect(['x64', 'arm64', 'x86', 'arm']).toContain(info.node.arch);
    });

    it('should detect OS correctly', () => {
      const info = env.getEnvironmentInfo();
      
      expect(['windows', 'macos', 'linux', 'unknown']).toContain(info.os.type);
      expect(info.os.arch).toBeTruthy();
      expect(info.os.version).toBeTruthy();
      expect(info.os.release).toBeTruthy();
      
      // One and only one OS should be true
      const osFlags = [info.os.isWindows, info.os.isMacOS, info.os.isLinux];
      const trueCount = osFlags.filter(Boolean).length;
      expect(trueCount).toBeLessThanOrEqual(1);
    });

    it('should have consistent boolean flags', () => {
      const info = env.getEnvironmentInfo();
      
      // Container consistency
      if (info.container.isContainer) {
        expect(
          info.container.isDocker || 
          info.container.isWSL || 
          info.container.isKubernetes
        ).toBe(true);
      }
      
      // Privilege consistency
      if (info.privileges.isRoot) {
        expect(info.privileges.isElevated).toBe(true);
      }
      
      // Cloud consistency
      if (info.cloud.isServerless) {
        expect(info.cloud.isCloud).toBe(true);
      }
    });

    it('should detect environment mode', () => {
      const info = env.getEnvironmentInfo();
      
      expect(['development', 'production', 'test', 'staging']).toContain(info.mode);
    });

    it('should provide consistent getter values', () => {
      const info = env.getEnvironmentInfo();
      
      expect(env.isWindows).toBe(info.os.isWindows);
      expect(env.isMacOS).toBe(info.os.isMacOS);
      expect(env.isLinux).toBe(info.os.isLinux);
      expect(env.isWSL).toBe(info.container.isWSL);
      expect(env.isDocker).toBe(info.container.isDocker);
      expect(env.isKubernetes).toBe(info.container.isKubernetes);
      expect(env.isContainer).toBe(info.container.isContainer);
      expect(env.isCI).toBe(info.ci.isCI);
      expect(env.isCloud).toBe(info.cloud.isCloud);
      expect(env.isServerless).toBe(info.cloud.isServerless);
      expect(env.isElevated).toBe(info.privileges.isElevated);
      expect(env.isRoot).toBe(info.privileges.isRoot);
      expect(env.isAdmin).toBe(info.privileges.isAdmin);
    });
  });

  describe('Performance characteristics', () => {
    it('should complete detection quickly', () => {
      const start = Date.now();
      env.getEnvironmentInfo();
      const duration = Date.now() - start;
      
      // Should complete within 50ms on most systems
      expect(duration).toBeLessThan(50);
    });

    it('should benefit from caching', () => {
      const detector = new EnvironmentDetector({ cache: true });
      
      // First call
      const start1 = Date.now();
      detector.getEnvironmentInfo();
      const duration1 = Date.now() - start1;
      
      // Second call (cached)
      const start2 = Date.now();
      detector.getEnvironmentInfo();
      const duration2 = Date.now() - start2;
      
      // Cached call should be significantly faster or at least not slower
      expect(duration2).toBeLessThanOrEqual(Math.max(duration1, 5));
      expect(duration2).toBeLessThan(10); // Should be under 10ms when cached
    });

    it('should handle multiple rapid calls', () => {
      const results = [];
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        results.push(env.getEnvironmentInfo());
      }
      
      const duration = Date.now() - start;
      
      // Should handle 100 calls quickly due to caching
      expect(duration).toBeLessThan(100);
      
      // All results should be identical (cached)
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(results[0]);
      }
    });
  });

  describe('Async detection', () => {
    it('should work with async detection', async () => {
      const info = await env.getEnvironmentInfoAsync();
      
      expect(info).toBeDefined();
      expect(info.os).toBeDefined();
      expect(info.container).toBeDefined();
      expect(info.ci).toBeDefined();
      expect(info.cloud).toBeDefined();
      expect(info.node).toBeDefined();
      expect(info.privileges).toBeDefined();
      expect(info.mode).toBeDefined();
    });

    it('should return same results for sync and async', async () => {
      const detector = new EnvironmentDetector({ cache: false });
      
      const syncInfo = detector.getEnvironmentInfo();
      const asyncInfo = await detector.getEnvironmentInfoAsync();
      
      expect(asyncInfo).toEqual(syncInfo);
    });
  });

  describe('Error handling', () => {
    it('should not throw errors during detection', () => {
      expect(() => env.getEnvironmentInfo()).not.toThrow();
      expect(() => env.isWindows).not.toThrow();
      expect(() => env.isDocker).not.toThrow();
      expect(() => env.isCI).not.toThrow();
      expect(() => env.isCloud).not.toThrow();
      expect(() => env.isElevated).not.toThrow();
    });

    it('should handle cache operations gracefully', () => {
      expect(() => env.clearCache()).not.toThrow();
      expect(() => env.enableCache()).not.toThrow();
      expect(() => env.disableCache()).not.toThrow();
      expect(() => env.reset()).not.toThrow();
    });
  });

  describe('Memory usage', () => {
    it('should not leak memory with repeated calls', () => {
      const initialMemory = process.memoryUsage();
      
      // Make many calls
      for (let i = 0; i < 1000; i++) {
        env.getEnvironmentInfo();
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage();
      
      // Memory increase should be reasonable (less than 20MB)
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024);
    });
  });
});