import env, { EnvironmentDetector, EnvironmentInfo } from '@oxog/environment-detector';

// Using the default instance
console.log('Using default instance:');
console.log(`Running on ${env.isWindows ? 'Windows' : env.isMacOS ? 'macOS' : 'Linux'}`);

if (env.isContainer) {
  console.log(`Container type: ${env.isDocker ? 'Docker' : env.isWSL ? 'WSL' : env.isKubernetes ? 'Kubernetes' : 'Unknown'}`);
}

if (env.isCI) {
  console.log('Running in CI/CD environment');
}

if (env.isCloud) {
  console.log('Running in cloud environment');
}

// Using a custom instance with options
const customDetector = new EnvironmentDetector({
  cache: true,
  cacheTimeout: 30000, // 30 seconds
});

// Get full environment info with proper TypeScript types
const info: EnvironmentInfo = customDetector.getEnvironmentInfo();

console.log('\\nDetailed OS Information:');
console.log(`Platform: ${info.os.type}`);
console.log(`Version: ${info.os.version}`);
console.log(`Architecture: ${info.os.arch}`);

if (info.container.isContainer) {
  console.log('\\nContainer Information:');
  console.log(`Type: ${info.container.containerType}`);
  if (info.container.isWSL) {
    console.log(`WSL Version: ${info.container.wslVersion}`);
    console.log(`Distribution: ${info.container.wslDistro}`);
  }
}

if (info.ci.isCI) {
  console.log('\\nCI/CD Information:');
  console.log(`Provider: ${info.ci.provider}`);
  console.log(`Name: ${info.ci.name}`);
  console.log(`Pull Request: ${info.ci.isPR}`);
}

if (info.cloud.isCloud) {
  console.log('\\nCloud Information:');
  console.log(`Provider: ${info.cloud.provider}`);
  console.log(`Serverless: ${info.cloud.isServerless}`);
  console.log(`Function Name: ${info.cloud.functionName}`);
  console.log(`Region: ${info.cloud.region}`);
}

console.log('\\nNode.js Information:');
console.log(`Version: ${info.node.version}`);
console.log(`Architecture: ${info.node.arch}`);
console.log(`Platform: ${info.node.platform}`);

console.log('\\nUser Privileges:');
console.log(`Username: ${info.privileges.username}`);
console.log(`Elevated: ${info.privileges.isElevated}`);
console.log(`Root: ${info.privileges.isRoot}`);
console.log(`Admin: ${info.privileges.isAdmin}`);
if (info.privileges.uid !== undefined) {
  console.log(`UID: ${info.privileges.uid}`);
}

console.log(`\\nEnvironment Mode: ${info.mode}`);

// Async usage
async function asyncExample() {
  console.log('\\nAsync detection:');
  const asyncInfo = await customDetector.getEnvironmentInfoAsync();
  console.log(`Async detection completed for ${asyncInfo.os.type}`);