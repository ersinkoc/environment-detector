export const DEFAULT_CACHE_TIMEOUT = 60000; // 1 minute

export const CI_ENV_VARS = Object.freeze({
  CI: 'CI',
  CONTINUOUS_INTEGRATION: 'CONTINUOUS_INTEGRATION',
  BUILD_NUMBER: 'BUILD_NUMBER',
  CI_NAME: 'CI_NAME',
} as const);

export const CI_PROVIDER_ENV_VARS = Object.freeze({
  GITHUB_ACTIONS: 'GITHUB_ACTIONS',
  GITLAB_CI: 'GITLAB_CI',
  TRAVIS: 'TRAVIS',
  CIRCLECI: 'CIRCLECI',
  JENKINS_URL: 'JENKINS_URL',
  BITBUCKET_BUILD_NUMBER: 'BITBUCKET_BUILD_NUMBER',
  TEAMCITY_VERSION: 'TEAMCITY_VERSION',
  APPVEYOR: 'APPVEYOR',
  CODEBUILD_BUILD_ID: 'CODEBUILD_BUILD_ID',
  TF_BUILD: 'TF_BUILD', // Azure Pipelines
} as const);

export const CLOUD_ENV_VARS = Object.freeze({
  AWS_LAMBDA_FUNCTION_NAME: 'AWS_LAMBDA_FUNCTION_NAME',
  AWS_EXECUTION_ENV: 'AWS_EXECUTION_ENV',
  AWS_REGION: 'AWS_REGION',
  FUNCTION_NAME: 'FUNCTION_NAME', // Google Cloud Functions
  K_SERVICE: 'K_SERVICE', // Google Cloud Run
  WEBSITE_SITE_NAME: 'WEBSITE_SITE_NAME', // Azure Functions
  VERCEL: 'VERCEL',
  VERCEL_ENV: 'VERCEL_ENV',
  NETLIFY: 'NETLIFY',
  CF_WORKER: 'CF_WORKER', // Cloudflare Workers
} as const);

export const CONTAINER_FILES = Object.freeze({
  DOCKER_ENV: '/.dockerenv',
  DOCKER_INIT: '/.dockerinit',
  WSL_INTEROP: '/run/WSL',
  KUBERNETES_SERVICE: '/var/run/secrets/kubernetes.io',
} as const);

export const WSL_INDICATORS = Object.freeze({
  ENV_VAR: 'WSL_DISTRO_NAME',
  PROC_VERSION: 'Microsoft',
  PROC_SYS: '/proc/sys/fs/binfmt_misc/WSLInterop',
} as const);

export const NODE_ENV_VALUES = Object.freeze({
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
  STAGING: 'staging',
} as const);