const env = require('@oxog/environment-detector');

console.log('Environment Detection Results');
console.log('============================');

// Basic boolean checks
console.log('Operating System:');
console.log(`  Windows: ${env.isWindows}`);
console.log(`  macOS: ${env.isMacOS}`);
console.log(`  Linux: ${env.isLinux}`);

console.log('\\nContainer Environment:');
console.log(`  Container: ${env.isContainer}`);
console.log(`  Docker: ${env.isDocker}`);
console.log(`  WSL: ${env.isWSL}`);
console.log(`  Kubernetes: ${env.isKubernetes}`);

console.log('\\nEnvironment Type:');
console.log(`  CI/CD: ${env.isCI}`);
console.log(`  Cloud: ${env.isCloud}`);
console.log(`  Serverless: ${env.isServerless}`);

console.log('\\nUser Privileges:');
console.log(`  Elevated: ${env.isElevated}`);
console.log(`  Root: ${env.isRoot}`);
console.log(`  Admin: ${env.isAdmin}`);

// Get detailed information
console.log('\\n\\nDetailed Information:');
const info = env.getEnvironmentInfo();
console.log(JSON.stringify(info, null, 2));