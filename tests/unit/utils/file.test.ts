// Mock fs module first
const mockAccessSync = jest.fn();
const mockReadFileSync = jest.fn();
const mockStatSync = jest.fn();
const mockAccess = jest.fn();
const mockReadFileAsync = jest.fn();

jest.mock('fs', () => ({
  accessSync: mockAccessSync,
  readFileSync: mockReadFileSync,
  statSync: mockStatSync,
  promises: {
    access: mockAccess,
    readFile: mockReadFileAsync,
  },
  constants: {
    F_OK: 0,
  },
}));

import {
  fileExists,
  readFile,
  fileExistsAsync,
  readFileAsync,
  isDirectory,
  getFileStats,
} from '../../../src/utils/file';

describe('File utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fileExists', () => {
    it('should return true when file exists', () => {
      mockAccessSync.mockImplementation(() => {});
      
      const result = fileExists('/path/to/file');
      
      expect(result).toBe(true);
      expect(mockAccessSync).toHaveBeenCalledWith('/path/to/file', 0);
    });

    it('should return false when file does not exist', () => {
      mockAccessSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const result = fileExists('/path/to/nonexistent');
      
      expect(result).toBe(false);
      expect(mockAccessSync).toHaveBeenCalledWith('/path/to/nonexistent', 0);
    });

    it('should handle permission errors', () => {
      mockAccessSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = fileExists('/path/to/protected');
      
      expect(result).toBe(false);
    });
  });

  describe('readFile', () => {
    it('should return file content when file is readable', () => {
      const mockContent = 'file content';
      mockReadFileSync.mockReturnValue(mockContent);
      
      const result = readFile('/path/to/file');
      
      expect(result).toBe(mockContent);
      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/file', 'utf8');
    });

    it('should return null when file cannot be read', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const result = readFile('/path/to/nonexistent');
      
      expect(result).toBeNull();
      expect(mockReadFileSync).toHaveBeenCalledWith('/path/to/nonexistent', 'utf8');
    });

    it('should return null on permission errors', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = readFile('/path/to/protected');
      
      expect(result).toBeNull();
    });

    it('should handle empty files', () => {
      mockReadFileSync.mockReturnValue('');
      
      const result = readFile('/path/to/empty');
      
      expect(result).toBe('');
    });
  });

  describe('fileExistsAsync', () => {
    it('should return true when file exists', async () => {
      mockAccess.mockResolvedValue(undefined);
      
      const result = await fileExistsAsync('/path/to/file');
      
      expect(result).toBe(true);
      expect(mockAccess).toHaveBeenCalledWith('/path/to/file', 0);
    });

    it('should return false when file does not exist', async () => {
      mockAccess.mockRejectedValue(new Error('File not found'));
      
      const result = await fileExistsAsync('/path/to/nonexistent');
      
      expect(result).toBe(false);
      expect(mockAccess).toHaveBeenCalledWith('/path/to/nonexistent', 0);
    });

    it('should handle permission errors', async () => {
      mockAccess.mockRejectedValue(new Error('Permission denied'));
      
      const result = await fileExistsAsync('/path/to/protected');
      
      expect(result).toBe(false);
    });
  });

  describe('readFileAsync', () => {
    it('should return file content when file is readable', async () => {
      const mockContent = 'async file content';
      mockReadFileAsync.mockResolvedValue(mockContent);
      
      const result = await readFileAsync('/path/to/file');
      
      expect(result).toBe(mockContent);
      expect(mockReadFileAsync).toHaveBeenCalledWith('/path/to/file', 'utf8');
    });

    it('should return null when file cannot be read', async () => {
      mockReadFileAsync.mockRejectedValue(new Error('File not found'));
      
      const result = await readFileAsync('/path/to/nonexistent');
      
      expect(result).toBeNull();
      expect(mockReadFileAsync).toHaveBeenCalledWith('/path/to/nonexistent', 'utf8');
    });

    it('should return null on permission errors', async () => {
      mockReadFileAsync.mockRejectedValue(new Error('Permission denied'));
      
      const result = await readFileAsync('/path/to/protected');
      
      expect(result).toBeNull();
    });

    it('should handle empty files', async () => {
      mockReadFileAsync.mockResolvedValue('');
      
      const result = await readFileAsync('/path/to/empty');
      
      expect(result).toBe('');
    });
  });

  describe('isDirectory', () => {
    it('should return true for directories', () => {
      const mockStats = {
        isDirectory: jest.fn().mockReturnValue(true),
      };
      mockStatSync.mockReturnValue(mockStats as any);
      
      const result = isDirectory('/path/to/dir');
      
      expect(result).toBe(true);
      expect(mockStatSync).toHaveBeenCalledWith('/path/to/dir');
      expect(mockStats.isDirectory).toHaveBeenCalled();
    });

    it('should return false for files', () => {
      const mockStats = {
        isDirectory: jest.fn().mockReturnValue(false),
      };
      mockStatSync.mockReturnValue(mockStats as any);
      
      const result = isDirectory('/path/to/file');
      
      expect(result).toBe(false);
      expect(mockStatSync).toHaveBeenCalledWith('/path/to/file');
      expect(mockStats.isDirectory).toHaveBeenCalled();
    });

    it('should return false when path does not exist', () => {
      mockStatSync.mockImplementation(() => {
        throw new Error('Path not found');
      });
      
      const result = isDirectory('/path/to/nonexistent');
      
      expect(result).toBe(false);
      expect(mockStatSync).toHaveBeenCalledWith('/path/to/nonexistent');
    });

    it('should return false on permission errors', () => {
      mockStatSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = isDirectory('/path/to/protected');
      
      expect(result).toBe(false);
    });
  });

  describe('getFileStats', () => {
    it('should return stats when path exists', () => {
      const mockStats = {
        size: 1024,
        mtime: new Date(),
        isFile: jest.fn().mockReturnValue(true),
        isDirectory: jest.fn().mockReturnValue(false),
      } as any;
      mockStatSync.mockReturnValue(mockStats);
      
      const result = getFileStats('/path/to/file');
      
      expect(result).toBe(mockStats);
      expect(mockStatSync).toHaveBeenCalledWith('/path/to/file');
    });

    it('should return null when path does not exist', () => {
      mockStatSync.mockImplementation(() => {
        throw new Error('Path not found');
      });
      
      const result = getFileStats('/path/to/nonexistent');
      
      expect(result).toBeNull();
      expect(mockStatSync).toHaveBeenCalledWith('/path/to/nonexistent');
    });

    it('should return null on permission errors', () => {
      mockStatSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      const result = getFileStats('/path/to/protected');
      
      expect(result).toBeNull();
    });
  });
});