import * as os from 'os';
import type { PrivilegeInfo } from '@/types';
import { BaseDetector } from '@/core/detector';
import { getUID, getGID, getUsername, isRoot, execSync } from '@/utils/process';

export class PrivilegeDetector extends BaseDetector<PrivilegeInfo> {
  public readonly name = 'privileges';

  protected performDetection(): PrivilegeInfo {
    const platform = os.platform();
    const uid = getUID();
    const gid = getGID();
    const username = getUsername();
    const isRootUser = isRoot();
    const isAdminUser = this.isAdmin(platform);
    const isElevated = isRootUser || isAdminUser;

    return {
      isElevated,
      isRoot: isRootUser,
      isAdmin: isAdminUser,
      uid,
      gid,
      username,
    };
  }

  private isAdmin(platform: NodeJS.Platform): boolean {
    switch (platform) {
      case 'win32':
        return this.isWindowsAdmin();
      case 'darwin':
      case 'linux':
        return this.isUnixAdmin();
      default:
        return false;
    }
  }

  private isWindowsAdmin(): boolean {
    try {
      // Check if running as administrator on Windows
      // This command will fail if not running as admin
      const result = execSync('net session 2>nul');
      return result !== null;
    } catch {
      // Try alternative method using whoami
      try {
        const whoami = execSync('whoami /groups');
        if (whoami) {
          // Check if the user is in the Administrators group
          return whoami.toLowerCase().includes('s-1-5-32-544') || 
                 whoami.toLowerCase().includes('administrators');
        }
        // If whoami returns null/undefined, fall through to next method
      } catch {
        // whoami failed, try next method
      }
      
      // Fallback: try to access a system directory that requires admin rights
      try {
        const systemDir = execSync('dir "%SystemRoot%\\System32\\config" 2>nul');
        return systemDir !== null;
      } catch {
        return false;
      }
    }
  }

  private isUnixAdmin(): boolean {
    // On Unix systems, check if user is root (UID 0)
    if (isRoot()) {
      return true;
    }

    // Check if user is in admin/sudo groups
    try {
      const groups = execSync('groups');
      if (groups) {
        const groupList = groups.toLowerCase();
        return (
          groupList.includes('admin') ||
          groupList.includes('sudo') ||
          groupList.includes('wheel') ||
          groupList.includes('root')
        );
      }
    } catch {
      // Fallback: check /etc/sudoers or /etc/group
      try {
        const sudoCheck = execSync('sudo -n true 2>/dev/null');
        return sudoCheck !== null;
      } catch {
        return false;
      }
    }

    return false;
  }
}