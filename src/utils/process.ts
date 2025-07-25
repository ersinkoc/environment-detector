import * as child_process from 'child_process';
import * as os from 'os';

export function getEnv(key: string): string | undefined {
  return process.env[key];
}

export function hasEnv(key: string): boolean {
  return key in process.env;
}

export function getEnvBoolean(key: string, defaultValue = false): boolean {
  const value = getEnv(key);
  if (!value) {
    return defaultValue;
  }
  return value.toLowerCase() === 'true' || value === '1';
}

export function execSync(command: string): string | null {
  try {
    return child_process.execSync(command, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

export async function execAsync(command: string): Promise<string | null> {
  return new Promise((resolve) => {
    child_process.exec(command, { encoding: 'utf8' }, (error, stdout) => {
      if (error) {
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

export function getUID(): number | undefined {
  if (process.getuid) {
    return process.getuid();
  }
  return undefined;
}

export function getGID(): number | undefined {
  if (process.getgid) {
    return process.getgid();
  }
  return undefined;
}

export function getUsername(): string | undefined {
  try {
    return os.userInfo().username;
  } catch {
    return undefined;
  }
}

export function isRoot(): boolean {
  return getUID() === 0;
}

export function parseNodeVersion(): {
  version: string;
  major: number;
  minor: number;
  patch: number;
} {
  const version = process.version;
  const [major, minor, patch] = version
    .slice(1)
    .split('.')
    .map((v) => parseInt(v, 10));

  return {
    version,
    major: major || 0,
    minor: minor || 0,
    patch: patch || 0,
  };
}