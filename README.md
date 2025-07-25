# @oxog/environment-detector

[![npm version](https://badge.fury.io/js/@oxog%2Fenvironment-detector.svg)](https://badge.fury.io/js/@oxog%2Fenvironment-detector)
[![TypeScript](https://badges.aleen42.io/src/typescript.svg)](https://badges.aleen42.io/src/typescript.svg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive, zero-dependency environment detection library for Node.js that combines the functionality of `is-wsl`, `is-docker`, `is-windows`, and similar packages into a single, performant solution.

## Features

- 🚀 **Zero Dependencies** - No external dependencies, only Node.js built-ins
- 🎯 **Comprehensive Detection** - OS, containers, CI/CD, cloud platforms, and more
- ⚡ **High Performance** - Lazy evaluation and intelligent caching
- 🔌 **Plugin System** - Extensible architecture for custom detectors
- 📦 **Dual Package Support** - Works with both CommonJS and ES modules
- 🛡️ **Type Safe** - Full TypeScript support with strict typing
- 🏃‍♂️ **CLI Interface** - Command-line tool for quick environment checks

## Installation

```bash
npm install @oxog/environment-detector
```

## Quick Start

```javascript
const env = require('@oxog/environment-detector');

// Simple boolean checks
console.log(env.isWindows);    // true/false
console.log(env.isDocker);     // true/false
console.log(env.isWSL);        // true/false
console.log(env.isCI);         // true/false

// Get detailed information
const info = env.getEnvironmentInfo();
console.log(info);
```

## TypeScript Usage

```typescript
import env, { EnvironmentDetector, EnvironmentInfo } from '@oxog/environment-detector';

// Use default instance
if (env.isContainer) {
  console.log(`Running in ${env.isDocker ? 'Docker' : 'other container'}`);
}

// Create custom instance with options
const detector = new EnvironmentDetector({
  cache: true,
  cacheTimeout: 30000
});

const info: EnvironmentInfo = detector.getEnvironmentInfo();
```

## Detection Capabilities

### Operating System
- **Windows** (`isWindows`) - Detects Windows operating system
- **macOS** (`isMacOS`) - Detects macOS/Darwin
- **Linux** (`isLinux`) - Detects Linux distributions

### Container Environments
- **Docker** (`isDocker`) - Detects Docker containers via `.dockerenv`, cgroups, and mount info
- **WSL** (`isWSL`) - Detects Windows Subsystem for Linux (v1 and v2)
- **Kubernetes** (`isKubernetes`) - Detects Kubernetes pods via service accounts and env vars

### CI/CD Platforms
- **GitHub Actions** - `GITHUB_ACTIONS`
- **GitLab CI** - `GITLAB_CI`
- **Jenkins** - `JENKINS_URL`
- **CircleCI** - `CIRCLECI`
- **Travis CI** - `TRAVIS`
- **Azure Pipelines** - `TF_BUILD`
- **Bitbucket Pipelines** - `BITBUCKET_BUILD_NUMBER`
- **AppVeyor** - `APPVEYOR`
- **AWS CodeBuild** - `CODEBUILD_BUILD_ID`
- **TeamCity** - `TEAMCITY_VERSION`

### Cloud Platforms
- **AWS Lambda** - Environment variables and execution context
- **Google Cloud Functions/Run** - `FUNCTION_NAME`, `K_SERVICE`
- **Azure Functions** - `WEBSITE_SITE_NAME` + function indicators
- **Vercel** - `VERCEL`, `VERCEL_ENV`
- **Netlify** - `NETLIFY` environment
- **Cloudflare Workers** - Runtime-specific detection

### User Privileges
- **Elevated Privileges** (`isElevated`) - Admin/root access
- **Root User** (`isRoot`) - Unix root user (UID 0)
- **Administrator** (`isAdmin`) - Windows administrator or Unix sudo access

## API Reference

### Default Instance

```javascript
const env = require('@oxog/environment-detector');

// Boolean getters
env.isWindows      // Windows OS
env.isMacOS        // macOS
env.isLinux        // Linux
env.isWSL          // Windows Subsystem for Linux
env.isDocker       // Docker container
env.isKubernetes   // Kubernetes pod
env.isContainer    // Any container environment
env.isCI           // CI/CD environment
env.isCloud        // Cloud platform
env.isServerless   // Serverless environment
env.isElevated     // Elevated privileges
env.isRoot         // Root user
env.isAdmin        // Administrator

// Methods
env.getEnvironmentInfo()      // Get complete info object
env.getEnvironmentInfoAsync() // Async version
env.clearCache()              // Clear detection cache
env.enableCache()             // Enable caching
env.disableCache()            // Disable caching
env.reset()                   // Reset all detectors
```

### EnvironmentInfo Object

```typescript
interface EnvironmentInfo {
  os: {
    platform: NodeJS.Platform;
    type: 'windows' | 'macos' | 'linux' | 'unknown';
    version: string;
    release: string;
    arch: string;
    isWindows: boolean;
    isMacOS: boolean;
    isLinux: boolean;
  };
  
  container: {
    isContainer: boolean;
    isDocker: boolean;
    isWSL: boolean;
    isKubernetes: boolean;
    containerType?: string;
    wslVersion?: number;
    wslDistro?: string;
  };
  
  ci: {
    isCI: boolean;
    name?: string;
    provider?: string;
    isPR?: boolean;
  };
  
  cloud: {
    isCloud: boolean;
    provider?: string;
    isServerless: boolean;
    functionName?: string;
    region?: string;
  };
  
  node: {
    version: string;
    major: number;
    minor: number;
    patch: number;
    arch: string;
    platform: NodeJS.Platform;
  };
  
  privileges: {
    isElevated: boolean;
    isRoot: boolean;
    isAdmin: boolean;
    uid?: number;
    gid?: number;
    username?: string;
  };
  
  mode: 'development' | 'production' | 'test' | 'staging';
}
```

### Custom Instance

```typescript
import { EnvironmentDetector } from '@oxog/environment-detector';

const detector = new EnvironmentDetector({
  cache: true,           // Enable caching (default: true)
  cacheTimeout: 60000,   // Cache timeout in ms (default: 60000)
  async: false           // Enable async mode (default: false)
});
```

## CLI Usage

Install globally for CLI access:

```bash
npm install -g @oxog/environment-detector
```

### Basic Usage

```bash
# Show all environment information
environment-detector

# Output as JSON
environment-detector --json

# Check specific environment (exit code 0/1)
environment-detector --check docker
environment-detector --check wsl
environment-detector --check ci

# List available detectors
environment-detector --list

# Run performance benchmark
environment-detector --benchmark

# Load custom plugin
environment-detector --plugin ./my-plugin.js

# Verbose output
environment-detector --verbose

# Show help
environment-detector --help
```

### Available Check Values

- `windows`, `macos`, `linux` - Operating systems
- `wsl`, `docker`, `kubernetes`, `container` - Container environments  
- `ci`, `cloud`, `serverless` - Platform types
- `elevated`, `root`, `admin` - Privilege levels

### Exit Codes

- `0` - Environment detected or command succeeded
- `1` - Environment not detected or error occurred

## Plugin System

Create custom detectors using the plugin system:

```typescript
import { BasePlugin, BaseDetector } from '@oxog/environment-detector';

class CustomDetector extends BaseDetector<{ isCustom: boolean }> {
  public readonly name = 'custom';
  
  protected performDetection() {
    return { isCustom: process.env.CUSTOM_ENV === 'true' };
  }
}

class CustomPlugin extends BasePlugin {
  public readonly name = 'custom-plugin';
  public readonly version = '1.0.0';
  public readonly detectors = [new CustomDetector()];
}

// Use the plugin
const detector = new EnvironmentDetector();
await detector.use(new CustomPlugin());
```

## Performance

Environment detection is optimized for performance:

- **First detection**: < 10ms
- **Cached detection**: < 0.1ms  
- **Full environment scan**: < 50ms
- **Memory footprint**: < 5MB

The library uses intelligent caching and lazy evaluation to minimize overhead.

## Comparison with Other Packages

| Package | Size | Dependencies | Detections | TypeScript | CLI |
|---------|------|--------------|------------|------------|-----|
| @oxog/environment-detector | ~50KB | 0 | 20+ | ✅ | ✅ |
| is-wsl | ~5KB | 1 | 1 | ❌ | ❌ |
| is-docker | ~3KB | 0 | 1 | ❌ | ❌ |
| is-windows | ~2KB | 0 | 1 | ❌ | ❌ |
| ci-info | ~15KB | 0 | 1 | ✅ | ❌ |

## Migration Guide

### From `is-wsl`
```javascript
// Before
const isWsl = require('is-wsl');

// After  
const env = require('@oxog/environment-detector');
const isWsl = env.isWSL;
```

### From `is-docker`
```javascript
// Before
const isDocker = require('is-docker');

// After
const env = require('@oxog/environment-detector');  
const isDocker = env.isDocker;
```

### From `ci-info`
```javascript
// Before
const { isCI, name } = require('ci-info');

// After
const env = require('@oxog/environment-detector');
const info = env.getEnvironmentInfo();
const isCI = info.ci.isCI;
const name = info.ci.name;
```

## Examples

See the [`examples/`](./examples) directory for:

- [Basic JavaScript usage](./examples/basic-usage/)
- [TypeScript usage](./examples/typescript-usage/)  
- [Custom plugin development](./examples/plugin-example/)
- [CLI usage examples](./examples/cli-usage/)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Setup

```bash
# Clone the repository
git clone https://github.com/ersinkoc/environment-detector.git
cd environment-detector

# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:ci

# Build the package
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

## License

MIT © [Ersin Koc](https://github.com/ersinkoc)

## Support

- 📖 [Documentation](./docs/)
- 🐛 [Issues](https://github.com/ersinkoc/environment-detector/issues)
- 💬 [Discussions](https://github.com/ersinkoc/environment-detector/discussions)

---

**Zero dependencies. Maximum compatibility. Comprehensive detection.**