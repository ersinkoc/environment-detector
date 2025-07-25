import { CloudDetector } from '../../../src/detectors/cloud';
import * as processUtils from '../../../src/utils/process';
import * as fileUtils from '../../../src/utils/file';
import type { CloudInfo } from '../../../src/types';

jest.mock('../../../src/utils/process');
jest.mock('../../../src/utils/file');

describe('CloudDetector', () => {
  let detector: CloudDetector;
  const mockProcessUtils = processUtils as jest.Mocked<typeof processUtils>;
  const mockFileUtils = fileUtils as jest.Mocked<typeof fileUtils>;
  
  // Save original global object
  const originalGlobal = global;

  beforeEach(() => {
    detector = new CloudDetector({ cache: false });
    jest.clearAllMocks();
    
    // Default all mocks to return false/undefined
    mockProcessUtils.hasEnv.mockReturnValue(false);
    mockProcessUtils.getEnv.mockReturnValue(undefined);
    mockFileUtils.fileExists.mockReturnValue(false);
    
    // Reset global object and clean up Cloudflare-specific properties
    global = originalGlobal;
    delete (global as any).caches;
    delete (global as any).CloudflareWorker;
    delete (global as any).MINIFLARE;
    if ((global as any).navigator) {
      delete (global as any).navigator;
    }
  });

  afterEach(() => {
    // Restore global object and clean up Cloudflare-specific properties
    global = originalGlobal;
    delete (global as any).caches;
    delete (global as any).CloudflareWorker;
    delete (global as any).MINIFLARE;
    if ((global as any).navigator) {
      delete (global as any).navigator;
    }
  });

  describe('detect', () => {
    it('should return isCloud false when no cloud environment detected', () => {
      const result = detector.detect() as CloudInfo;
      
      expect(result).toEqual({
        isCloud: false,
        provider: undefined,
        isServerless: false,
        functionName: undefined,
        region: undefined,
      });
    });
  });

  describe('AWS Lambda detection', () => {
    it('should detect AWS Lambda with function name', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'AWS_LAMBDA_FUNCTION_NAME');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'AWS_LAMBDA_FUNCTION_NAME' ? 'my-function' : 
        key === 'AWS_REGION' ? 'us-east-1' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('aws-lambda');
      expect(result.isServerless).toBe(true);
      expect(result.functionName).toBe('my-function');
      expect(result.region).toBe('us-east-1');
    });

    it('should detect AWS Lambda with execution env', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'AWS_EXECUTION_ENV');
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('aws-lambda');
      expect(result.isServerless).toBe(true);
    });

    it('should detect AWS with Lambda runtime API', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'AWS_LAMBDA_RUNTIME_API');
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('aws-lambda');
    });

    it('should detect AWS with _HANDLER', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === '_HANDLER');
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('aws-lambda');
    });

    it('should detect AWS with LAMBDA_TASK_ROOT', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'LAMBDA_TASK_ROOT');
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('aws-lambda');
    });

    it('should detect AWS with ECS metadata', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'ECS_CONTAINER_METADATA_URI');
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('aws-lambda');
    });

    it('should detect AWS with EC2 metadata', () => {
      mockFileUtils.fileExists.mockImplementation((path) => path === '/sys/hypervisor/uuid');
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('aws-lambda');
    });

    it('should use AWS_DEFAULT_REGION as fallback', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'AWS_EXECUTION_ENV');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'AWS_DEFAULT_REGION' ? 'eu-west-1' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.region).toBe('eu-west-1');
    });
  });

  describe('Google Cloud Functions detection', () => {
    it('should detect Google Cloud Functions with FUNCTION_NAME', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'FUNCTION_NAME');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'FUNCTION_NAME' ? 'my-gcf-function' :
        key === 'FUNCTION_REGION' ? 'us-central1' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('google-cloud-functions');
      expect(result.isServerless).toBe(true);
      expect(result.functionName).toBe('my-gcf-function');
      expect(result.region).toBe('us-central1');
    });

    it('should detect Google Cloud Run with K_SERVICE', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'K_SERVICE');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'K_SERVICE' ? 'my-cloud-run-service' :
        key === 'GCP_REGION' ? 'europe-west1' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('google-cloud-functions');
      expect(result.isServerless).toBe(true);
      expect(result.functionName).toBe('my-cloud-run-service');
      expect(result.region).toBe('europe-west1');
    });
  });

  describe('Azure Functions detection', () => {
    it('should detect Azure Functions', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'WEBSITE_SITE_NAME' || key === 'FUNCTIONS_EXTENSION_VERSION'
      );
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'WEBSITE_SITE_NAME' ? 'my-azure-function' :
        key === 'REGION_NAME' ? 'West US' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('azure-functions');
      expect(result.isServerless).toBe(true);
      expect(result.functionName).toBe('my-azure-function');
      expect(result.region).toBe('West US');
    });

    it('should use AZURE_REGION as fallback', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'WEBSITE_SITE_NAME' || key === 'FUNCTIONS_EXTENSION_VERSION'
      );
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'AZURE_REGION' ? 'East US' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.region).toBe('East US');
    });
  });

  describe('Vercel detection', () => {
    it('should detect Vercel with VERCEL env', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'VERCEL');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'VERCEL_REGION' ? 'iad1' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('vercel');
      expect(result.isServerless).toBe(false);
      expect(result.region).toBe('iad1');
    });

    it('should detect Vercel with VERCEL_ENV', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'VERCEL_ENV');
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('vercel');
    });

    it('should detect Vercel serverless function', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'VERCEL' || key === 'VERCEL_FUNCTION'
      );
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'VERCEL_FUNCTION' ? 'api/hello' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isServerless).toBe(true);
      expect(result.functionName).toBe('api/hello');
    });
  });

  describe('Netlify detection', () => {
    it('should detect Netlify with NETLIFY env', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'NETLIFY');
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('netlify');
      expect(result.isServerless).toBe(false);
    });

    it('should detect Netlify with NETLIFY_BUILD_BASE', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'NETLIFY_BUILD_BASE');
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('netlify');
    });

    it('should detect Netlify serverless function', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'NETLIFY' || key === 'NETLIFY_FUNCTION_NAME'
      );
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'NETLIFY_FUNCTION_NAME' ? 'hello-world' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isServerless).toBe(true);
      expect(result.functionName).toBe('hello-world');
    });

    it('should detect Netlify dev environment as serverless', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'NETLIFY' || key === 'NETLIFY_DEV'
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isServerless).toBe(true);
    });
  });

  describe('Cloudflare Workers detection', () => {
    it('should detect Cloudflare Workers with CF_WORKER env', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'CF_WORKER');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'CF_WORKER_NAME' ? 'my-worker' :
        key === 'CF_REGION' ? 'auto' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('cloudflare-workers');
      expect(result.isServerless).toBe(true);
      expect(result.functionName).toBe('my-worker');
      expect(result.region).toBe('auto');
    });

    it('should detect Cloudflare Workers with caches API', () => {
      const mockCaches = { default: {} };
      (global as any).caches = mockCaches;
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('cloudflare-workers');
    });

    it('should detect Cloudflare Workers with CloudflareWorker global', () => {
      (global as any).CloudflareWorker = true;
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('cloudflare-workers');
    });

    it('should detect Miniflare (local Cloudflare Workers)', () => {
      (global as any).MINIFLARE = true;
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('cloudflare-workers');
    });

    it('should detect Cloudflare Workers by user agent', () => {
      (global as any).navigator = { userAgent: 'Cloudflare-Workers' };
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.isCloud).toBe(true);
      expect(result.provider).toBe('cloudflare-workers');
    });

    it('should handle errors in Cloudflare detection gracefully', () => {
      // Create a getter that throws
      Object.defineProperty(global, 'CloudflareWorker', {
        get: () => { throw new Error('Access denied'); },
        configurable: true,
      });
      
      expect(() => detector.detect()).not.toThrow();
      
      // Clean up
      delete (global as any).CloudflareWorker;
    });

    it('should use WORKER_NAME as fallback for function name', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'CF_WORKER');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'WORKER_NAME' ? 'fallback-worker' : undefined
      );
      
      const result = detector.detect() as CloudInfo;
      
      expect(result.functionName).toBe('fallback-worker');
    });
  });

  describe('isServerlessEnvironment', () => {
    it('should return false for undefined provider', () => {
      const result = detector.detect() as CloudInfo;
      expect(result.isServerless).toBe(false);
    });

    it('should identify serverless providers correctly', () => {
      const serverlessProviders = [
        'aws-lambda',
        'google-cloud-functions', 
        'azure-functions',
        'cloudflare-workers'
      ];

      serverlessProviders.forEach(provider => {
        const isServerless = detector['isServerlessEnvironment'](provider as any);
        expect(isServerless).toBe(true);
      });
    });

    it('should return false for unknown provider in isServerlessEnvironment', () => {
      const isServerless = detector['isServerlessEnvironment']('unknown-provider' as any);
      expect(isServerless).toBe(false);
    });
  });

  describe('getFunctionName', () => {
    it('should return undefined for unknown provider', () => {
      const functionName = detector['getFunctionName']('unknown-provider' as any);
      expect(functionName).toBeUndefined();
    });
  });
});