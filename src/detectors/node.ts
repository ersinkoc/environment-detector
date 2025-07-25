import * as os from 'os';
import type { NodeInfo, EnvironmentMode } from '@/types';
import { BaseDetector } from '@/core/detector';
import { parseNodeVersion, getEnv } from '@/utils/process';
import { NODE_ENV_VALUES } from '@/core/constants';

export class NodeDetector extends BaseDetector<NodeInfo> {
  public readonly name = 'node';

  protected performDetection(): NodeInfo {
    const { version, major, minor, patch } = parseNodeVersion();
    const arch = os.arch();
    const platform = os.platform();

    return {
      version,
      major,
      minor,
      patch,
      arch,
      platform,
    };
  }
}

export class EnvironmentModeDetector extends BaseDetector<EnvironmentMode> {
  public readonly name = 'mode';

  protected performDetection(): EnvironmentMode {
    const nodeEnv = getEnv('NODE_ENV')?.toLowerCase();

    switch (nodeEnv) {
      case NODE_ENV_VALUES.PRODUCTION:
        return 'production';
      case NODE_ENV_VALUES.DEVELOPMENT:
        return 'development';
      case NODE_ENV_VALUES.TEST:
        return 'test';
      case NODE_ENV_VALUES.STAGING:
        return 'staging';
      default:
        // Default to development if NODE_ENV is not set
        return 'development';
    }
  }
}