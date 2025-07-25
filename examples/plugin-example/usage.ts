import { EnvironmentDetector } from '@oxog/environment-detector';
import plugin from './custom-plugin';

// Create a new detector instance
const detector = new EnvironmentDetector();

async function main() {
  // Install the custom plugin
  await detector.use(plugin);
  
  // Get environment info (now includes plugin detectors)
  const info = detector.getEnvironmentInfo();
  
  console.log('Base Environment Info:');
  console.log(`OS: ${info.os.type}`);
  console.log(`Container: ${info.container.isContainer}`);
  console.log(`CI: ${info.ci.isCI}`);
  
  // Access plugin detector results through the plugin manager
  const pluginManager = detector.pluginManager;
  const context = pluginManager.getContext();
  
  const ideDetector = context.getDetector('ide');
  const packageManagerDetector = context.getDetector('packageManager');
  
  if (ideDetector) {
    const ideInfo = ideDetector.detect() as any;
    console.log('\\nIDE Detection:');
    console.log(`VS Code: ${ideInfo.isVSCode}`);
    console.log(`WebStorm: ${ideInfo.isWebStorm}`);
    console.log(`Current IDE: ${ideInfo.ide || 'Unknown'}`);
  }
  
  if (packageManagerDetector) {
    const packageInfo = packageManagerDetector.detect() as any;
    console.log('\\nPackage Manager Detection:');
    console.log(`npm: ${packageInfo.npm}`);
    console.log(`yarn: ${packageInfo.yarn}`);
    console.log(`pnpm: ${packageInfo.pnpm}`);
    console.log(`Current manager: ${packageInfo.manager || 'Unknown'}`);
  }
  
  // Remove plugin when done
  await detector.removePlugin('development-environment');
  console.log('\\nPlugin removed');
}

main().catch(console.error);