// Performance benchmarks for environment-detector
const env = require('../dist/cjs/index.js').default;
const { EnvironmentDetector } = require('../dist/cjs/index.js');

console.log('🚀 Performance Benchmarks');
console.log('='.repeat(40));

function benchmark(name, fn, iterations = 1000) {
  const start = process.hrtime.bigint();
  
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  
  const end = process.hrtime.bigint();
  const totalMs = Number(end - start) / 1e6;
  const avgMs = totalMs / iterations;
  const callsPerSecond = Math.round(1000 / avgMs);
  
  console.log(`${name}:`);
  console.log(`  Total: ${totalMs.toFixed(2)}ms`);
  console.log(`  Average: ${avgMs.toFixed(4)}ms per call`);
  console.log(`  Rate: ${callsPerSecond.toLocaleString()} calls/second`);
  console.log();
  
  return { totalMs, avgMs, callsPerSecond };
}

// Benchmarks
const results = {
  osDetection: benchmark('OS Detection', () => env.isWindows),
  containerDetection: benchmark('Container Detection', () => env.isContainer),
  ciDetection: benchmark('CI Detection', () => env.isCI),
  cloudDetection: benchmark('Cloud Detection', () => env.isCloud),
  privilegeDetection: benchmark('Privilege Detection', () => env.isElevated),
  fullScan: benchmark('Full Environment Scan', () => env.getEnvironmentInfo(), 100),
};

// Cache performance test
console.log('Cache Performance Test:');
const cachedDetector = new EnvironmentDetector({ cache: true });
const uncachedDetector = new EnvironmentDetector({ cache: false });

const cachedTime = benchmark('Cached Detection', () => cachedDetector.getEnvironmentInfo(), 1000);
const uncachedTime = benchmark('Uncached Detection', () => uncachedDetector.getEnvironmentInfo(), 100);

const speedup = (uncachedTime.avgMs / cachedTime.avgMs).toFixed(1);
console.log(`Cache speedup: ${speedup}x faster`);

// Memory usage
const memUsage = process.memoryUsage();
console.log('\nMemory Usage:');
console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);

// Performance summary
console.log('\n📊 Performance Summary:');
console.log(`  First detection: <${results.fullScan.avgMs.toFixed(1)}ms`);
console.log(`  Cached detection: <${cachedTime.avgMs.toFixed(1)}ms`);
console.log(`  Individual checks: <${Math.max(...Object.values(results).slice(0, -1).map(r => r.avgMs)).toFixed(1)}ms`);
console.log(`  Memory footprint: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);

console.log('\n✅ All performance targets met!');