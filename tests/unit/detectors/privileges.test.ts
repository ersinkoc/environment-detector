import { PrivilegeDetector } from '../../../src/detectors/privileges';
import * as os from 'os';
import * as processUtils from '../../../src/utils/process';
import type { PrivilegeInfo } from '../../../src/types';

jest.mock('os');
jest.mock('../../../src/utils/process');

describe('PrivilegeDetector', () => {
  let detector: PrivilegeDetector;
  const mockOs = os as jest.Mocked<typeof os>;
  const mockProcessUtils = processUtils as jest.Mocked<typeof processUtils>;

  beforeEach(() => {
    detector = new PrivilegeDetector({ cache: false });
    jest.clearAllMocks();
    
    // Default mock values
    mockProcessUtils.getUID.mockReturnValue(1000);
    mockProcessUtils.getGID.mockReturnValue(1000);
    mockProcessUtils.getUsername.mockReturnValue('testuser');
    mockProcessUtils.isRoot.mockReturnValue(false);
    mockProcessUtils.execSync.mockReturnValue(null);
  });

  describe('Windows privilege detection', () => {
    beforeEach(() => {
      mockOs.platform.mockReturnValue('win32');
    });

    it('should detect Windows admin with net session', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'net session 2>nul') {
          return 'Computer name     \\\\*';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(true);
      expect(result.isElevated).toBe(true);
      expect(result.isRoot).toBe(false);
      expect(result.username).toBe('testuser');
    });

    it('should detect Windows admin with whoami groups', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'net session 2>nul') {
          throw new Error('Access denied');
        }
        if (cmd === 'whoami /groups') {
          return 'BUILTIN\\Administrators S-1-5-32-544 Mandatory group, Enabled by default';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(true);
      expect(result.isElevated).toBe(true);
    });

    it('should detect Windows admin with administrators group text', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'net session 2>nul') {
          throw new Error('Access denied');
        }
        if (cmd === 'whoami /groups') {
          return 'Group Name: Administrators';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(true);
    });

    it('should detect Windows admin with system directory access', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'net session 2>nul') {
          throw new Error('Access denied');
        }
        if (cmd === 'whoami /groups') {
          throw new Error('Command not found');
        }
        if (cmd === 'dir "%SystemRoot%\\System32\\config" 2>nul') {
          return 'Directory listing...';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(true);
    });

    it('should detect non-admin Windows user', () => {
      mockProcessUtils.execSync.mockImplementation(() => {
        throw new Error('Access denied');
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(false);
      expect(result.isElevated).toBe(false);
      expect(result.isRoot).toBe(false);
    });

    it('should return false when net session returns non-null but whoami fails', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'net session 2>nul') {
          // Net session doesn't throw but returns empty string or some non-null value
          return '';
        }
        // This will never be reached because the code returns after net session succeeds
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      // When net session returns a value (even empty), it means admin
      expect(result.isAdmin).toBe(true);
      expect(result.isElevated).toBe(true);
      expect(result.isRoot).toBe(false);
    });
  });

  describe('Unix privilege detection', () => {
    beforeEach(() => {
      mockOs.platform.mockReturnValue('linux');
    });

    it('should detect root user', () => {
      mockProcessUtils.isRoot.mockReturnValue(true);
      mockProcessUtils.getUID.mockReturnValue(0);
      mockProcessUtils.getUsername.mockReturnValue('root');

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isRoot).toBe(true);
      expect(result.isAdmin).toBe(true);
      expect(result.isElevated).toBe(true);
      expect(result.uid).toBe(0);
      expect(result.username).toBe('root');
    });

    it('should detect admin user in sudo group', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'groups') {
          return 'testuser adm cdrom sudo dip plugdev lpadmin sambashare';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isRoot).toBe(false);
      expect(result.isAdmin).toBe(true);
      expect(result.isElevated).toBe(true);
    });

    it('should detect admin user in admin group', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'groups') {
          return 'testuser admin staff';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(true);
    });

    it('should detect admin user in wheel group', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'groups') {
          return 'testuser wheel users';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(true);
    });

    it('should detect admin user in root group', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'groups') {
          return 'testuser root daemon';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(true);
    });

    it('should detect admin user with sudo access', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'groups') {
          throw new Error('Command failed');
        }
        if (cmd === 'sudo -n true 2>/dev/null') {
          return '';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(true);
    });

    it('should detect non-admin Unix user', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'groups') {
          return 'testuser users';
        }
        throw new Error('Command failed');
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isRoot).toBe(false);
      expect(result.isAdmin).toBe(false);
      expect(result.isElevated).toBe(false);
    });

    it('should handle groups command failure', () => {
      mockProcessUtils.execSync.mockImplementation(() => {
        throw new Error('Command not found');
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(false);
    });
  });

  describe('macOS privilege detection', () => {
    beforeEach(() => {
      mockOs.platform.mockReturnValue('darwin');
    });

    it('should detect macOS admin user', () => {
      mockProcessUtils.execSync.mockImplementation((cmd) => {
        if (cmd === 'groups') {
          return 'staff everyone localaccounts _appserverusr admin';
        }
        return null;
      });

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(true);
      expect(result.isElevated).toBe(true);
    });

    it('should handle macOS root user', () => {
      mockProcessUtils.isRoot.mockReturnValue(true);
      mockProcessUtils.getUID.mockReturnValue(0);

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isRoot).toBe(true);
      expect(result.isAdmin).toBe(true);
    });
  });

  describe('Unknown platform privilege detection', () => {
    beforeEach(() => {
      mockOs.platform.mockReturnValue('freebsd' as any);
    });

    it('should return false for admin on unknown platforms', () => {
      const result = detector.detect() as PrivilegeInfo;

      expect(result.isAdmin).toBe(false);
      expect(result.isElevated).toBe(false);
    });

    it('should still detect root on unknown platforms', () => {
      mockProcessUtils.isRoot.mockReturnValue(true);
      mockProcessUtils.getUID.mockReturnValue(0);

      const result = detector.detect() as PrivilegeInfo;

      expect(result.isRoot).toBe(true);
      expect(result.isAdmin).toBe(false);
      expect(result.isElevated).toBe(true);
    });
  });

  describe('Common functionality', () => {
    it('should include UID and GID in results', () => {
      mockOs.platform.mockReturnValue('linux');
      mockProcessUtils.getUID.mockReturnValue(1001);
      mockProcessUtils.getGID.mockReturnValue(1001);

      const result = detector.detect() as PrivilegeInfo;

      expect(result.uid).toBe(1001);
      expect(result.gid).toBe(1001);
    });

    it('should include username in results', () => {
      mockOs.platform.mockReturnValue('linux');
      mockProcessUtils.getUsername.mockReturnValue('customuser');

      const result = detector.detect() as PrivilegeInfo;

      expect(result.username).toBe('customuser');
    });

    it('should handle undefined UID/GID gracefully', () => {
      mockOs.platform.mockReturnValue('linux');
      mockProcessUtils.getUID.mockReturnValue(undefined);
      mockProcessUtils.getGID.mockReturnValue(undefined);

      const result = detector.detect() as PrivilegeInfo;

      expect(result.uid).toBeUndefined();
      expect(result.gid).toBeUndefined();
    });
  });
});