import * as os from 'os';
import type { OSInfo } from '@/types';
import { BaseDetector } from '@/core/detector';

export class OSDetector extends BaseDetector<OSInfo> {
  public readonly name = 'os';

  protected performDetection(): OSInfo {
    try {
      const platform = os.platform();
      const release = os.release();
      const version = os.version ? os.version() : release;
      const arch = os.arch();

      let type: OSInfo['type'] = 'unknown';
      let isWindows = false;
      let isMacOS = false;
      let isLinux = false;

      switch (platform) {
        case 'win32':
          type = 'windows';
          isWindows = true;
          break;
        case 'darwin':
          type = 'macos';
          isMacOS = true;
          break;
        case 'linux':
          type = 'linux';
          isLinux = true;
          break;
      }

      return {
        platform,
        type,
        version,
        release,
        arch,
        isWindows,
        isMacOS,
        isLinux,
      };
    } catch {
      // Return default values when detection fails
      return {
        platform: 'linux',
        type: 'unknown',
        arch: 'unknown',
        release: 'unknown',
        version: 'unknown',
        isWindows: false,
        isMacOS: false,
        isLinux: false,
      };
    }
  }
}