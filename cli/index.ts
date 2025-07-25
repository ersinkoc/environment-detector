#!/usr/bin/env node

import { EnvironmentDetector } from '../src/index';
import * as fs from 'fs';
import * as path from 'path';

interface CLIOptions {
  json?: boolean;
  check?: string;
  list?: boolean;
  plugin?: string;
  verbose?: boolean;
  benchmark?: boolean;
  help?: boolean;
  version?: boolean;
}

class CLI {
  private env = new EnvironmentDetector();
  private options: CLIOptions = {};

  public async run(): Promise<void> {
    this.parseArgs();

    if (this.options.help) {
      this.showHelp();
      return;
    }

    if (this.options.version) {
      this.showVersion();
      return;
    }

    if (this.options.list) {
      this.listDetectors();
      return;
    }

    if (this.options.plugin) {
      await this.loadPlugin(this.options.plugin);
    }

    if (this.options.benchmark) {
      await this.runBenchmark();
      return;
    }

    if (this.options.check) {
      await this.checkEnvironment(this.options.check);
      return;
    }

    // Default: show full environment info
    await this.showEnvironmentInfo();
  }

  private parseArgs(): void {
    const args = process.argv.slice(2);
    
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      switch (arg) {
        case '--json':
          this.options.json = true;
          break;
        case '--check':
          this.options.check = args[++i];
          break;
        case '--list':
          this.options.list = true;
          break;
        case '--plugin':
          this.options.plugin = args[++i];
          break;
        case '--verbose':
          this.options.verbose = true;
          break;
        case '--benchmark':
          this.options.benchmark = true;
          break;
        case '--help':
        case '-h':
          this.options.help = true;
          break;
        case '--version':
        case '-v':
          this.options.version = true;
          break;
        default:
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
      }
    }
  }

  private showHelp(): void {
    console.log(`
@oxog/environment-detector CLI

Usage: environment-detector [options]

Options:
  --json              Output full environment info as JSON
  --check <env>       Check specific environment (returns exit code)
  --list              List all available detectors
  --plugin <path>     Load custom plugin
  --verbose           Detailed detection process
  --benchmark         Run performance benchmarks
  --help, -h          Show this help message
  --version, -v       Show version number

Examples:
  environment-detector --json
  environment-detector --check docker
  environment-detector --check wsl
  environment-detector --list
  environment-detector --plugin ./my-plugin.js
  environment-detector --benchmark

Check environment values:
  windows, macos, linux, wsl, docker, kubernetes, container,
  ci, cloud, serverless, elevated, root, admin

Exit codes:
  0 - Success (environment detected or general success)
  1 - Failure (environment not detected or error)
`);
  }

  private showVersion(): void {
    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
      );
      console.log(packageJson.version);
    } catch {
      console.log('Unknown version');
    }
  }

  private listDetectors(): void {
    const detectors = [
      'os - Operating system detection',
      'container - Container environment detection (Docker, WSL, Kubernetes)',
      'ci - CI/CD environment detection',
      'cloud - Cloud platform detection',
      'node - Node.js version and runtime info', 
      'privileges - User privilege detection',
      'mode - Environment mode (development, production, etc.)',
    ];

    console.log('Available detectors:');
    detectors.forEach(detector => console.log(`  ${detector}`));
  }

  private async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const resolvedPath = path.resolve(pluginPath);
      const plugin = await import(resolvedPath);
      
      if (plugin.default) {
        await this.env.use(plugin.default);
        if (this.options.verbose) {
          console.log(`Loaded plugin: ${plugin.default.name}`);
        }
      } else {
        throw new Error('Plugin must export a default plugin object');
      }
    } catch (error) {
      console.error(`Failed to load plugin: ${error}`);
      process.exit(1);
    }
  }

  private async runBenchmark(): Promise<void> {
    console.log('Running performance benchmarks...\n');

    const benchmarks = [
      { name: 'OS Detection', fn: () => this.env.isWindows },
      { name: 'Container Detection', fn: () => this.env.isContainer },
      { name: 'CI Detection', fn: () => this.env.isCI },
      { name: 'Cloud Detection', fn: () => this.env.isCloud },
      { name: 'Privilege Detection', fn: () => this.env.isElevated },
      { name: 'Full Environment Info', fn: () => this.env.getEnvironmentInfo() },
    ];

    for (const benchmark of benchmarks) {
      const iterations = 1000;
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < iterations; i++) {
        benchmark.fn();
      }
      
      const end = process.hrtime.bigint();
      const totalMs = Number(end - start) / 1e6;
      const avgMs = totalMs / iterations;
      
      console.log(`${benchmark.name}:`);
      console.log(`  Total: ${totalMs.toFixed(2)}ms`);
      console.log(`  Average: ${avgMs.toFixed(4)}ms per call`);
      console.log(`  Rate: ${(1000 / avgMs).toFixed(0)} calls/second\n`);
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    console.log('Memory Usage:');
    console.log(`  RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  }

  private async checkEnvironment(envCheck: string): Promise<void> {
    const env = envCheck.toLowerCase();
    let result = false;
    let description = '';

    switch (env) {
      case 'windows':
        result = this.env.isWindows;
        description = 'Windows operating system';
        break;
      case 'macos':
        result = this.env.isMacOS;
        description = 'macOS operating system';
        break;
      case 'linux':
        result = this.env.isLinux;
        description = 'Linux operating system';
        break;
      case 'wsl':
        result = this.env.isWSL;
        description = 'Windows Subsystem for Linux';
        break;
      case 'docker':
        result = this.env.isDocker;
        description = 'Docker container';
        break;
      case 'kubernetes':
        result = this.env.isKubernetes;
        description = 'Kubernetes pod';
        break;
      case 'container':
        result = this.env.isContainer;
        description = 'Any container environment';
        break;
      case 'ci':
        result = this.env.isCI;
        description = 'CI/CD environment';
        break;
      case 'cloud':
        result = this.env.isCloud;
        description = 'Cloud platform';
        break;
      case 'serverless':
        result = this.env.isServerless;
        description = 'Serverless environment';
        break;
      case 'elevated':
        result = this.env.isElevated;
        description = 'Elevated privileges';
        break;
      case 'root':
        result = this.env.isRoot;
        description = 'Root user';
        break;
      case 'admin':
        result = this.env.isAdmin;
        description = 'Administrator user';
        break;
      default:
        console.error(`Unknown environment check: ${envCheck}`);
        process.exit(1);
    }

    if (this.options.verbose) {
      console.log(`Checking for ${description}...`);
    }

    if (this.options.json) {
      console.log(JSON.stringify({ [env]: result }, null, 2));
    } else if (this.options.verbose) {
      console.log(result ? `✓ ${description} detected` : `✗ ${description} not detected`);
    } else {
      console.log(result.toString());
    }

    process.exit(result ? 0 : 1);
  }

  private async showEnvironmentInfo(): Promise<void> {
    const info = this.env.getEnvironmentInfo();

    if (this.options.json) {
      console.log(JSON.stringify(info, null, 2));
    } else {
      this.printHumanReadable(info);
    }
  }

  private printHumanReadable(info: any): void {
    console.log('Environment Detection Results');
    console.log('============================\n');

    // Operating System
    console.log('Operating System:');
    console.log(`  Platform: ${info.os.type} (${info.os.platform})`);
    console.log(`  Version: ${info.os.version}`);
    console.log(`  Architecture: ${info.os.arch}\n`);

    // Container
    console.log('Container Environment:');
    if (info.container.isContainer) {
      console.log(`  Type: ${info.container.containerType}`);
      if (info.container.isWSL) {
        console.log(`  WSL Version: ${info.container.wslVersion}`);
        if (info.container.wslDistro) {
          console.log(`  WSL Distribution: ${info.container.wslDistro}`);
        }
      }
    } else {
      console.log('  No container environment detected');
    }
    console.log();

    // CI/CD
    console.log('CI/CD Environment:');
    if (info.ci.isCI) {
      console.log(`  Provider: ${info.ci.name} (${info.ci.provider})`);
      console.log(`  Pull Request: ${info.ci.isPR ? 'Yes' : 'No'}`);
    } else {
      console.log('  No CI/CD environment detected');
    }
    console.log();

    // Cloud
    console.log('Cloud Environment:');
    if (info.cloud.isCloud) {
      console.log(`  Provider: ${info.cloud.provider}`);
      console.log(`  Serverless: ${info.cloud.isServerless ? 'Yes' : 'No'}`);
      if (info.cloud.functionName) {
        console.log(`  Function: ${info.cloud.functionName}`);
      }
      if (info.cloud.region) {
        console.log(`  Region: ${info.cloud.region}`);
      }
    } else {
      console.log('  No cloud environment detected');
    }
    console.log();

    // Node.js
    console.log('Node.js Runtime:');
    console.log(`  Version: ${info.node.version}`);
    console.log(`  Architecture: ${info.node.arch}`);
    console.log(`  Platform: ${info.node.platform}\n`);

    // Privileges
    console.log('User Privileges:');
    console.log(`  Elevated: ${info.privileges.isElevated ? 'Yes' : 'No'}`);
    console.log(`  Root: ${info.privileges.isRoot ? 'Yes' : 'No'}`);
    console.log(`  Admin: ${info.privileges.isAdmin ? 'Yes' : 'No'}`);
    if (info.privileges.username) {
      console.log(`  Username: ${info.privileges.username}`);
    }
    if (info.privileges.uid !== undefined) {
      console.log(`  UID: ${info.privileges.uid}`);
    }
    console.log();

    // Environment Mode
    console.log(`Environment Mode: ${info.mode}`);
  }
}

// Run CLI
const cli = new CLI();
cli.run().catch((error) => {
  console.error('CLI Error:', error);
  process.exit(1);
});