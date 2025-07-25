import type { CloudInfo, CloudProvider } from '@/types';
import { BaseDetector } from '@/core/detector';
import { CLOUD_ENV_VARS } from '@/core/constants';
import { getEnv, hasEnv } from '@/utils/process';
import { fileExists } from '@/utils/file';

export class CloudDetector extends BaseDetector<CloudInfo> {
  public readonly name = 'cloud';

  protected performDetection(): CloudInfo {
    const provider = this.detectCloudProvider();
    const isCloud = provider !== undefined;
    const isServerless = this.isServerlessEnvironment(provider);
    const functionName = this.getFunctionName(provider);
    const region = this.getRegion(provider);

    return {
      isCloud,
      provider,
      isServerless,
      functionName,
      region,
    };
  }

  private detectCloudProvider(): CloudProvider | undefined {
    // AWS Lambda
    if (hasEnv(CLOUD_ENV_VARS.AWS_LAMBDA_FUNCTION_NAME) || hasEnv(CLOUD_ENV_VARS.AWS_EXECUTION_ENV)) {
      return 'aws-lambda';
    }

    // Google Cloud Functions / Cloud Run
    if (hasEnv(CLOUD_ENV_VARS.FUNCTION_NAME) || hasEnv(CLOUD_ENV_VARS.K_SERVICE)) {
      return 'google-cloud-functions';
    }

    // Azure Functions
    if (hasEnv(CLOUD_ENV_VARS.WEBSITE_SITE_NAME) && hasEnv('FUNCTIONS_EXTENSION_VERSION')) {
      return 'azure-functions';
    }

    // Vercel
    if (hasEnv(CLOUD_ENV_VARS.VERCEL) || hasEnv(CLOUD_ENV_VARS.VERCEL_ENV)) {
      return 'vercel';
    }

    // Netlify
    if (hasEnv(CLOUD_ENV_VARS.NETLIFY) || hasEnv('NETLIFY_BUILD_BASE')) {
      return 'netlify';
    }

    // Cloudflare Workers
    if (hasEnv(CLOUD_ENV_VARS.CF_WORKER) || this.detectCloudflareWorkers()) {
      return 'cloudflare-workers';
    }

    // Additional AWS detection
    if (this.detectAWS()) {
      return 'aws-lambda';
    }

    return undefined;
  }

  private isServerlessEnvironment(provider?: CloudProvider): boolean {
    if (!provider) {
      return false;
    }

    switch (provider) {
      case 'aws-lambda':
      case 'google-cloud-functions':
      case 'azure-functions':
      case 'cloudflare-workers':
        return true;
      case 'vercel':
      case 'netlify':
        // These can be serverless or edge functions
        return hasEnv('VERCEL_FUNCTION') || hasEnv('NETLIFY_FUNCTION_NAME') || hasEnv('NETLIFY_DEV');
      default:
        return false;
    }
  }

  private getFunctionName(provider?: CloudProvider): string | undefined {
    if (!provider) {
      return undefined;
    }

    switch (provider) {
      case 'aws-lambda':
        return getEnv(CLOUD_ENV_VARS.AWS_LAMBDA_FUNCTION_NAME);
      case 'google-cloud-functions':
        return getEnv(CLOUD_ENV_VARS.FUNCTION_NAME) || getEnv(CLOUD_ENV_VARS.K_SERVICE);
      case 'azure-functions':
        return getEnv(CLOUD_ENV_VARS.WEBSITE_SITE_NAME);
      case 'vercel':
        return getEnv('VERCEL_FUNCTION');
      case 'netlify':
        return getEnv('NETLIFY_FUNCTION_NAME');
      case 'cloudflare-workers':
        return getEnv('CF_WORKER_NAME') || getEnv('WORKER_NAME');
      default:
        return undefined;
    }
  }

  private getRegion(provider?: CloudProvider): string | undefined {
    if (!provider) {
      return undefined;
    }

    switch (provider) {
      case 'aws-lambda':
        return getEnv(CLOUD_ENV_VARS.AWS_REGION) || getEnv('AWS_DEFAULT_REGION');
      case 'google-cloud-functions':
        return getEnv('FUNCTION_REGION') || getEnv('GCP_REGION');
      case 'azure-functions':
        return getEnv('REGION_NAME') || getEnv('AZURE_REGION');
      case 'vercel':
        return getEnv('VERCEL_REGION');
      case 'cloudflare-workers':
        return getEnv('CF_REGION');
      default:
        return undefined;
    }
  }

  private detectAWS(): boolean {
    // Check for AWS-specific environment variables
    if (
      hasEnv('AWS_EXECUTION_ENV') ||
      hasEnv('AWS_LAMBDA_RUNTIME_API') ||
      hasEnv('_HANDLER') ||
      hasEnv('LAMBDA_TASK_ROOT') ||
      hasEnv('LAMBDA_RUNTIME_DIR')
    ) {
      return true;
    }

    // Check for ECS metadata
    if (hasEnv('ECS_CONTAINER_METADATA_URI') || hasEnv('ECS_CONTAINER_METADATA_URI_V4')) {
      return true;
    }

    // Check for EC2 metadata service
    if (fileExists('/sys/hypervisor/uuid')) {
      return true;
    }

    return false;
  }

  private detectCloudflareWorkers(): boolean {
    // Cloudflare Workers specific detection
    if (typeof global !== 'undefined' && 'caches' in global && 'default' in (global as any).caches) {
      return true;
    }

    // Check for Cloudflare-specific globals (in a try-catch for safety)
    try {
      const globalAny = global as any;
      if (
        globalAny.CloudflareWorker ||
        globalAny.MINIFLARE ||
        (globalAny.navigator && globalAny.navigator.userAgent === 'Cloudflare-Workers')
      ) {
        return true;
      }
    } catch {
      // Ignore errors
    }

    return false;
  }
}