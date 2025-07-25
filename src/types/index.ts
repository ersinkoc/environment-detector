export interface EnvironmentInfo {
  os: OSInfo;
  container: ContainerInfo;
  ci: CIInfo;
  cloud: CloudInfo;
  node: NodeInfo;
  privileges: PrivilegeInfo;
  mode: EnvironmentMode;
}

export interface OSInfo {
  platform: NodeJS.Platform;
  type: 'windows' | 'macos' | 'linux' | 'unknown';
  version: string;
  release: string;
  arch: string;
  isWindows: boolean;
  isMacOS: boolean;
  isLinux: boolean;
}

export interface ContainerInfo {
  isContainer: boolean;
  isDocker: boolean;
  isWSL: boolean;
  isKubernetes: boolean;
  containerType?: 'docker' | 'wsl' | 'kubernetes' | 'unknown';
  wslVersion?: number;
  wslDistro?: string;
}

export interface CIInfo {
  isCI: boolean;
  name?: string;
  isPR?: boolean;
  provider?: CIProvider;
}

export type CIProvider =
  | 'github-actions'
  | 'gitlab-ci'
  | 'jenkins'
  | 'circleci'
  | 'travis-ci'
  | 'azure-pipelines'
  | 'bitbucket-pipelines'
  | 'teamcity'
  | 'appveyor'
  | 'codebuild'
  | 'unknown';

export interface CloudInfo {
  isCloud: boolean;
  provider?: CloudProvider;
  isServerless: boolean;
  functionName?: string;
  region?: string;
}

export type CloudProvider =
  | 'aws-lambda'
  | 'google-cloud-functions'
  | 'azure-functions'
  | 'vercel'
  | 'netlify'
  | 'cloudflare-workers'
  | 'unknown';

export interface NodeInfo {
  version: string;
  major: number;
  minor: number;
  patch: number;
  arch: string;
  platform: NodeJS.Platform;
}

export interface PrivilegeInfo {
  isElevated: boolean;
  isRoot: boolean;
  isAdmin: boolean;
  uid?: number;
  gid?: number;
  username?: string;
}

export type EnvironmentMode = 'development' | 'production' | 'test' | 'staging';

export interface DetectorOptions {
  cache?: boolean;
  cacheTimeout?: number;
  async?: boolean;
}

export interface Detector<T = unknown> {
  name: string;
  detect(): T | Promise<T>;
  reset?(): void;
}

export interface CacheEntry<T = unknown> {
  value: T;
  timestamp: number;
  timeout: number;
}