import * as fs from 'fs';

export function fileExists(path: string): boolean {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export function readFile(path: string): string | null {
  try {
    return fs.readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

export async function fileExistsAsync(path: string): Promise<boolean> {
  try {
    await fs.promises.access(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readFileAsync(path: string): Promise<string | null> {
  try {
    return await fs.promises.readFile(path, 'utf8');
  } catch {
    return null;
  }
}

export function isDirectory(path: string): boolean {
  try {
    const stats = fs.statSync(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

export function getFileStats(path: string): fs.Stats | null {
  try {
    return fs.statSync(path);
  } catch {
    return null;
  }
}