import * as child_process from 'child_process';
import * as os from 'os';
import {
  getEnv,
  hasEnv,
  getEnvBoolean,
  execSync,
  execAsync,
  getUID,
  getGID,
  getUsername,
  isRoot,
  parseNodeVersion,
} from '../../../src/utils/process';

jest.mock('child_process');
jest.mock('os');

describe('Process utils', () => {
  const originalEnv = process.env;
  const originalGetuid = process.getuid;
  const originalGetgid = process.getgid;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    process.getuid = originalGetuid;
    process.getgid = originalGetgid;
  });

  describe('getEnv', () => {
    it('should return environment variable value', () => {
      process.env['TEST_VAR'] = 'test_value';
      
      const result = getEnv('TEST_VAR');
      
      expect(result).toBe('test_value');
    });

    it('should return undefined for non-existent variable', () => {
      delete process.env['NON_EXISTENT'];
      
      const result = getEnv('NON_EXISTENT');
      
      expect(result).toBeUndefined();
    });

    it('should handle empty string values', () => {
      process.env['EMPTY_VAR'] = '';
      
      const result = getEnv('EMPTY_VAR');
      
      expect(result).toBe('');
    });
  });

  describe('hasEnv', () => {
    it('should return true for existing environment variable', () => {
      process.env['EXISTS'] = 'value';
      
      const result = hasEnv('EXISTS');
      
      expect(result).toBe(true);
    });

    it('should return false for non-existent variable', () => {
      delete process.env['NOT_EXISTS'];
      
      const result = hasEnv('NOT_EXISTS');
      
      expect(result).toBe(false);
    });

    it('should return true even for empty string values', () => {
      process.env['EMPTY'] = '';
      
      const result = hasEnv('EMPTY');
      
      expect(result).toBe(true);
    });
  });

  describe('getEnvBoolean', () => {
    it('should return true for "true" value', () => {
      process.env['BOOL_VAR'] = 'true';
      
      const result = getEnvBoolean('BOOL_VAR');
      
      expect(result).toBe(true);
    });

    it('should return true for "TRUE" value (case insensitive)', () => {
      process.env['BOOL_VAR'] = 'TRUE';
      
      const result = getEnvBoolean('BOOL_VAR');
      
      expect(result).toBe(true);
    });

    it('should return true for "1" value', () => {
      process.env['BOOL_VAR'] = '1';
      
      const result = getEnvBoolean('BOOL_VAR');
      
      expect(result).toBe(true);
    });

    it('should return false for "false" value', () => {
      process.env['BOOL_VAR'] = 'false';
      
      const result = getEnvBoolean('BOOL_VAR', true);
      
      expect(result).toBe(false);
    });

    it('should return false for "0" value', () => {
      process.env['BOOL_VAR'] = '0';
      
      const result = getEnvBoolean('BOOL_VAR', true);
      
      expect(result).toBe(false);
    });

    it('should return default value when variable does not exist', () => {
      delete process.env['MISSING_VAR'];
      
      expect(getEnvBoolean('MISSING_VAR')).toBe(false);
      expect(getEnvBoolean('MISSING_VAR', true)).toBe(true);
    });

    it('should return default value for empty string', () => {
      process.env['EMPTY_VAR'] = '';
      
      expect(getEnvBoolean('EMPTY_VAR')).toBe(false);
      expect(getEnvBoolean('EMPTY_VAR', true)).toBe(true);
    });

    it('should return false for other string values', () => {
      process.env['BOOL_VAR'] = 'maybe';
      
      const result = getEnvBoolean('BOOL_VAR', true);
      
      expect(result).toBe(false);
    });
  });

  describe('execSync', () => {
    const mockExecSync = child_process.execSync as jest.MockedFunction<typeof child_process.execSync>;

    it('should execute command and return trimmed output', () => {
      mockExecSync.mockReturnValue('  command output  \n' as any);
      
      const result = execSync('echo test');
      
      expect(result).toBe('command output');
      expect(mockExecSync).toHaveBeenCalledWith('echo test', {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });
    });

    it('should return null on command failure', () => {
      mockExecSync.mockImplementation(() => {
        throw new Error('Command failed');
      });
      
      const result = execSync('invalid command');
      
      expect(result).toBeNull();
    });

    it('should handle empty output', () => {
      mockExecSync.mockReturnValue('' as any);
      
      const result = execSync('echo -n');
      
      expect(result).toBe('');
    });
  });

  describe('execAsync', () => {
    const mockExec = child_process.exec as jest.MockedFunction<typeof child_process.exec>;

    it('should execute command and return trimmed output', async () => {
      mockExec.mockImplementation((_cmd, _opts, callback) => {
        callback!(null, '  async output  \n', '');
        return {} as any;
      });
      
      const result = await execAsync('echo test');
      
      expect(result).toBe('async output');
      expect(mockExec).toHaveBeenCalledWith('echo test', { encoding: 'utf8' }, expect.any(Function));
    });

    it('should return null on command failure', async () => {
      mockExec.mockImplementation((_cmd, _opts, callback) => {
        callback!(new Error('Command failed'), '', '');
        return {} as any;
      });
      
      const result = await execAsync('invalid command');
      
      expect(result).toBeNull();
    });

    it('should handle empty output', async () => {
      mockExec.mockImplementation((_cmd, _opts, callback) => {
        callback!(null, '', '');
        return {} as any;
      });
      
      const result = await execAsync('echo -n');
      
      expect(result).toBe('');
    });

    it('should handle whitespace-only output', async () => {
      mockExec.mockImplementation((_cmd, _opts, callback) => {
        callback!(null, '   \n\t  ', '');
        return {} as any;
      });
      
      const result = await execAsync('echo spaces');
      
      expect(result).toBe('');
    });
  });

  describe('getUID', () => {
    it('should return UID when getuid is available', () => {
      process.getuid = jest.fn().mockReturnValue(1000);
      
      const result = getUID();
      
      expect(result).toBe(1000);
      expect(process.getuid).toHaveBeenCalled();
    });

    it('should return undefined when getuid is not available', () => {
      process.getuid = undefined as any;
      
      const result = getUID();
      
      expect(result).toBeUndefined();
    });

    it('should handle root user (UID 0)', () => {
      process.getuid = jest.fn().mockReturnValue(0);
      
      const result = getUID();
      
      expect(result).toBe(0);
    });
  });

  describe('getGID', () => {
    it('should return GID when getgid is available', () => {
      process.getgid = jest.fn().mockReturnValue(1000);
      
      const result = getGID();
      
      expect(result).toBe(1000);
      expect(process.getgid).toHaveBeenCalled();
    });

    it('should return undefined when getgid is not available', () => {
      process.getgid = undefined as any;
      
      const result = getGID();
      
      expect(result).toBeUndefined();
    });

    it('should handle root group (GID 0)', () => {
      process.getgid = jest.fn().mockReturnValue(0);
      
      const result = getGID();
      
      expect(result).toBe(0);
    });
  });

  describe('getUsername', () => {
    const mockUserInfo = os.userInfo as jest.MockedFunction<typeof os.userInfo>;

    it('should return username from os.userInfo', () => {
      mockUserInfo.mockReturnValue({
        username: 'testuser',
        uid: 1000,
        gid: 1000,
        shell: '/bin/bash',
        homedir: '/home/testuser',
      });
      
      const result = getUsername();
      
      expect(result).toBe('testuser');
      expect(mockUserInfo).toHaveBeenCalled();
    });

    it('should return undefined on error', () => {
      mockUserInfo.mockImplementation(() => {
        throw new Error('Failed to get user info');
      });
      
      const result = getUsername();
      
      expect(result).toBeUndefined();
    });
  });

  describe('isRoot', () => {
    it('should return true when UID is 0', () => {
      process.getuid = jest.fn().mockReturnValue(0);
      
      const result = isRoot();
      
      expect(result).toBe(true);
    });

    it('should return false when UID is not 0', () => {
      process.getuid = jest.fn().mockReturnValue(1000);
      
      const result = isRoot();
      
      expect(result).toBe(false);
    });

    it('should return false when getuid is not available', () => {
      process.getuid = undefined as any;
      
      const result = isRoot();
      
      expect(result).toBe(false);
    });
  });

  describe('parseNodeVersion', () => {
    const originalVersion = process.version;

    afterEach(() => {
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        writable: true,
        configurable: true,
      });
    });

    it('should parse standard Node.js version', () => {
      Object.defineProperty(process, 'version', {
        value: 'v16.14.2',
        writable: true,
        configurable: true,
      });
      
      const result = parseNodeVersion();
      
      expect(result).toEqual({
        version: 'v16.14.2',
        major: 16,
        minor: 14,
        patch: 2,
      });
    });

    it('should parse version with pre-release', () => {
      Object.defineProperty(process, 'version', {
        value: 'v18.0.0-pre',
        writable: true,
        configurable: true,
      });
      
      const result = parseNodeVersion();
      
      expect(result).toEqual({
        version: 'v18.0.0-pre',
        major: 18,
        minor: 0,
        patch: 0,
      });
    });

    it('should handle malformed version gracefully', () => {
      Object.defineProperty(process, 'version', {
        value: 'vInvalid',
        writable: true,
        configurable: true,
      });
      
      const result = parseNodeVersion();
      
      expect(result).toEqual({
        version: 'vInvalid',
        major: 0,
        minor: 0,
        patch: 0,
      });
    });

    it('should handle missing parts', () => {
      Object.defineProperty(process, 'version', {
        value: 'v20',
        writable: true,
        configurable: true,
      });
      
      const result = parseNodeVersion();
      
      expect(result).toEqual({
        version: 'v20',
        major: 20,
        minor: 0,
        patch: 0,
      });
    });
  });
});