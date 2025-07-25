import type { CIInfo, CIProvider } from '@/types';
import { BaseDetector } from '@/core/detector';
import { CI_ENV_VARS, CI_PROVIDER_ENV_VARS } from '@/core/constants';
import { getEnv, getEnvBoolean, hasEnv } from '@/utils/process';

export class CIDetector extends BaseDetector<CIInfo> {
  public readonly name = 'ci';

  protected performDetection(): CIInfo {
    const isCI = this.detectCI();
    
    if (!isCI) {
      return { isCI: false };
    }

    const provider = this.detectCIProvider();
    const name = this.getCIName(provider);
    const isPR = this.detectPullRequest(provider);

    return {
      isCI,
      name,
      isPR,
      provider,
    };
  }

  private detectCI(): boolean {
    // Check common CI environment variables
    if (
      getEnvBoolean(CI_ENV_VARS.CI) ||
      getEnvBoolean(CI_ENV_VARS.CONTINUOUS_INTEGRATION) ||
      hasEnv(CI_ENV_VARS.BUILD_NUMBER) ||
      hasEnv(CI_ENV_VARS.CI_NAME)
    ) {
      return true;
    }

    // Check for specific CI providers
    for (const envVar of Object.values(CI_PROVIDER_ENV_VARS)) {
      if (hasEnv(envVar)) {
        return true;
      }
    }

    return false;
  }

  private detectCIProvider(): CIProvider {
    // GitHub Actions
    if (getEnvBoolean(CI_PROVIDER_ENV_VARS.GITHUB_ACTIONS)) {
      return 'github-actions';
    }

    // GitLab CI
    if (getEnvBoolean(CI_PROVIDER_ENV_VARS.GITLAB_CI)) {
      return 'gitlab-ci';
    }

    // Travis CI
    if (getEnvBoolean(CI_PROVIDER_ENV_VARS.TRAVIS)) {
      return 'travis-ci';
    }

    // CircleCI
    if (getEnvBoolean(CI_PROVIDER_ENV_VARS.CIRCLECI)) {
      return 'circleci';
    }

    // Jenkins
    if (hasEnv(CI_PROVIDER_ENV_VARS.JENKINS_URL)) {
      return 'jenkins';
    }

    // Azure Pipelines
    if (getEnvBoolean(CI_PROVIDER_ENV_VARS.TF_BUILD)) {
      return 'azure-pipelines';
    }

    // Bitbucket Pipelines
    if (hasEnv(CI_PROVIDER_ENV_VARS.BITBUCKET_BUILD_NUMBER)) {
      return 'bitbucket-pipelines';
    }

    // TeamCity
    if (hasEnv(CI_PROVIDER_ENV_VARS.TEAMCITY_VERSION)) {
      return 'teamcity';
    }

    // AppVeyor
    if (getEnvBoolean(CI_PROVIDER_ENV_VARS.APPVEYOR)) {
      return 'appveyor';
    }

    // AWS CodeBuild
    if (hasEnv(CI_PROVIDER_ENV_VARS.CODEBUILD_BUILD_ID)) {
      return 'codebuild';
    }

    return 'unknown';
  }

  private getCIName(provider: CIProvider): string {
    switch (provider) {
      case 'github-actions':
        return 'GitHub Actions';
      case 'gitlab-ci':
        return 'GitLab CI';
      case 'travis-ci':
        return 'Travis CI';
      case 'circleci':
        return 'CircleCI';
      case 'jenkins':
        return 'Jenkins';
      case 'azure-pipelines':
        return 'Azure Pipelines';
      case 'bitbucket-pipelines':
        return 'Bitbucket Pipelines';
      case 'teamcity':
        return 'TeamCity';
      case 'appveyor':
        return 'AppVeyor';
      case 'codebuild':
        return 'AWS CodeBuild';
      default:
        return getEnv(CI_ENV_VARS.CI_NAME) || 'Unknown CI';
    }
  }

  private detectPullRequest(provider: CIProvider): boolean {
    switch (provider) {
      case 'github-actions':
        return getEnv('GITHUB_EVENT_NAME') === 'pull_request';
      
      case 'gitlab-ci':
        return hasEnv('CI_MERGE_REQUEST_ID') || hasEnv('CI_EXTERNAL_PULL_REQUEST_IID');
      
      case 'travis-ci':
        return getEnv('TRAVIS_PULL_REQUEST') !== 'false';
      
      case 'circleci':
        return hasEnv('CIRCLE_PULL_REQUEST') || hasEnv('CIRCLE_PR_NUMBER');
      
      case 'jenkins':
        return hasEnv('CHANGE_ID') || hasEnv('ghprbPullId');
      
      case 'azure-pipelines':
        return hasEnv('SYSTEM_PULLREQUEST_PULLREQUESTID');
      
      case 'bitbucket-pipelines':
        return hasEnv('BITBUCKET_PR_ID');
      
      case 'teamcity':
        return hasEnv('TEAMCITY_PULL_REQUEST_NUMBER');
      
      case 'appveyor':
        return hasEnv('APPVEYOR_PULL_REQUEST_NUMBER');
      
      case 'codebuild':
        return hasEnv('CODEBUILD_WEBHOOK_HEAD_REF') && 
               getEnv('CODEBUILD_WEBHOOK_HEAD_REF')?.startsWith('refs/pull/') || false;
      
      default:
        // Generic PR detection
        return hasEnv('PR_NUMBER') || hasEnv('PULL_REQUEST_ID') || hasEnv('PULL_REQUEST');
    }
  }
}