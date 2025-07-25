import env, { EnvironmentDetector, VERSION } from '@oxog/environment-detector';

console.log('Advanced Usage Examples');
console.log('='.repeat(40));

// Version information
console.log(`Package version: ${VERSION}`);
console.log(`Using: ${env.getVersion()}`);

// Package information
const packageInfo = env.getPackageInfo();
console.log('Package info:', packageInfo);

// Environment summary
console.log(`Environment: ${env.getEnvironmentSummary()}`);

// Performance monitoring
const performanceTest = () => {
  const iterations = 10000;
  console.log(`\nPerformance test (${iterations.toLocaleString()} iterations):`);
  
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    env.isWindows;
    env.isContainer;
    env.isCI;
  }
  
  const end = process.hrtime.bigint();
  const totalMs = Number(end - start) / 1e6;
  const avgMs = totalMs / iterations;
  
  console.log(`  Total: ${totalMs.toFixed(2)}ms`);
  console.log(`  Average: ${avgMs.toFixed(6)}ms per call`);
  console.log(`  Rate: ${Math.round(1000 / avgMs).toLocaleString()} calls/second`);
};

performanceTest();

// Error handling example
const safeDetection = () => {
  try {
    const info = env.getEnvironmentInfo();
    console.log('\nSafe detection successful:', {
      os: info.os.type,
      container: info.container.isContainer,
      ci: info.ci.isCI,
      cloud: info.cloud.isCloud,
      mode: info.mode
    });
  } catch (error) {
    console.error('Detection failed:', error);
  }
};

safeDetection();

// Custom instance with specific options
const customDetector = new EnvironmentDetector({
  cache: false,
  cacheTimeout: 5000
});

console.log('\nCustom detector (no cache):', {
  windows: customDetector.isWindows,
  container: customDetector.isContainer,
  summary: customDetector.getEnvironmentSummary()
});

// Async detection with error handling
const asyncDetection = async () => {
  try {
    console.log('\nAsync detection:');
    const info = await env.getEnvironmentInfoAsync();
    console.log(`  Completed for ${info.os.type} environment`);
    console.log(`  Node.js ${info.node.version} on ${info.node.arch}`);
  } catch (error) {
    console.error('Async detection failed:', error);
  }
};

asyncDetection();

// Cache management
console.log('\nCache management:');
console.log(`  Cache enabled: ${env.getPackageInfo().cacheEnabled}`);
console.log('  Clearing cache...');
env.clearCache();
console.log('  Cache cleared ✓');

// Environment-specific logic
if (env.isWindows) {
  console.log('\n🪟 Windows-specific functionality');
} else if (env.isMacOS) {
  console.log('\n🍎 macOS-specific functionality');
} else if (env.isLinux) {
  console.log('\n🐧 Linux-specific functionality');
}

if (env.isContainer) {
  console.log(`📦 Container detected: ${env.getEnvironmentInfo().container.containerType}`);
}

if (env.isCI) {
  console.log(`🔄 CI/CD environment: ${env.getEnvironmentInfo().ci.provider}`);
}

if (env.isCloud) {
  console.log(`☁️ Cloud platform: ${env.getEnvironmentInfo().cloud.provider}`);
}

if (env.isElevated) {
  console.log('🔐 Running with elevated privileges');
}

console.log('\n✅ Advanced usage examples completed!');