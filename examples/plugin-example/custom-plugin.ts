import { BasePlugin, BaseDetector } from '@oxog/environment-detector';
import type { PluginContext } from '@oxog/environment-detector';

// Custom detector for detecting if we're running in a specific IDE
class IDEDetector extends BaseDetector<{ isVSCode: boolean; isWebStorm: boolean; ide?: string }> {
  public readonly name = 'ide';

  protected performDetection() {
    const isVSCode = process.env.TERM_PROGRAM === 'vscode' || 
                     process.env.VSCODE_PID !== undefined ||
                     process.env.VSCODE_CWD !== undefined;

    const isWebStorm = process.env.WEBIDE_VM_OPTIONS !== undefined ||
                       process.env.WEBSTORM_VM_OPTIONS !== undefined;

    let ide: string | undefined;
    if (isVSCode) ide = 'Visual Studio Code';
    if (isWebStorm) ide = 'WebStorm';

    return { isVSCode, isWebStorm, ide };
  }
}

// Custom detector for detecting package managers
class PackageManagerDetector extends BaseDetector<{ npm: boolean; yarn: boolean; pnpm: boolean; manager?: string }> {
  public readonly name = 'packageManager';

  protected performDetection() {
    const userAgent = process.env.npm_config_user_agent || '';
    
    const npm = userAgent.includes('npm');
    const yarn = userAgent.includes('yarn');
    const pnpm = userAgent.includes('pnpm');

    let manager: string | undefined;
    if (pnpm) manager = 'pnpm';
    else if (yarn) manager = 'yarn';
    else if (npm) manager = 'npm';

    return { npm, yarn, pnpm, manager };
  }
}

// Custom plugin that adds IDE and package manager detection
export class DevelopmentEnvironmentPlugin extends BasePlugin {
  public readonly name = 'development-environment';
  public readonly version = '1.0.0';
  public readonly description = 'Detects development environment details like IDE and package manager';
  
  public readonly detectors = [
    new IDEDetector(),
    new PackageManagerDetector(),
  ];

  protected async onInstall(context: PluginContext): Promise<void> {
    console.log('Development Environment Plugin installed');
    
    // Listen for plugin events
    context.on('detection:complete', (data) => {
      console.log('Detection completed:', data);
    });
  }

  protected async onUninstall(): Promise<void> {
    console.log('Development Environment Plugin uninstalled');
  }
}

export default new DevelopmentEnvironmentPlugin();