import { CIDetector } from '../../../src/detectors/ci';
import * as processUtils from '../../../src/utils/process';
import type { CIInfo } from '../../../src/types';

jest.mock('../../../src/utils/process');

describe('CIDetector', () => {
  let detector: CIDetector;
  const mockProcessUtils = processUtils as jest.Mocked<typeof processUtils>;

  beforeEach(() => {
    detector = new CIDetector({ cache: false });
    jest.clearAllMocks();
    
    // Default all mocks to return false/undefined
    mockProcessUtils.getEnvBoolean.mockReturnValue(false);
    mockProcessUtils.hasEnv.mockReturnValue(false);
    mockProcessUtils.getEnv.mockReturnValue(undefined);
  });

  describe('detect', () => {
    it('should return isCI false when no CI environment detected', () => {
      const result = detector.detect() as CIInfo;
      
      expect(result).toEqual({ isCI: false });
    });

    it('should detect CI with generic CI env var', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'CI');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('unknown');
    });

    it('should detect CI with CONTINUOUS_INTEGRATION env var', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'CONTINUOUS_INTEGRATION');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
    });

    it('should detect CI with BUILD_NUMBER env var', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'BUILD_NUMBER');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
    });

    it('should detect CI with CI_NAME env var', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'CI_NAME');
      mockProcessUtils.getEnv.mockImplementation((key) => key === 'CI_NAME' ? 'CustomCI' : undefined);
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.name).toBe('CustomCI');
    });
  });

  describe('GitHub Actions detection', () => {
    it('should detect GitHub Actions', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'GITHUB_ACTIONS');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'GITHUB_ACTIONS');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('github-actions');
      expect(result.name).toBe('GitHub Actions');
      expect(result.isPR).toBe(false);
    });

    it('should detect pull request in GitHub Actions', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'GITHUB_ACTIONS');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'GITHUB_ACTIONS');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'GITHUB_EVENT_NAME' ? 'pull_request' : undefined
      );
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });
  });

  describe('GitLab CI detection', () => {
    it('should detect GitLab CI', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'GITLAB_CI');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'GITLAB_CI');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('gitlab-ci');
      expect(result.name).toBe('GitLab CI');
    });

    it('should detect merge request with CI_MERGE_REQUEST_ID', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'GITLAB_CI');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'GITLAB_CI' || key === 'CI_MERGE_REQUEST_ID');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });

    it('should detect external pull request', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'GITLAB_CI');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'GITLAB_CI' || key === 'CI_EXTERNAL_PULL_REQUEST_IID');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });
  });

  describe('Travis CI detection', () => {
    it('should detect Travis CI', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'TRAVIS');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'TRAVIS');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('travis-ci');
      expect(result.name).toBe('Travis CI');
    });

    it('should detect pull request when TRAVIS_PULL_REQUEST is not false', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'TRAVIS');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'TRAVIS');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'TRAVIS_PULL_REQUEST' ? '123' : undefined
      );
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });

    it('should not detect PR when TRAVIS_PULL_REQUEST is false', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'TRAVIS');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'TRAVIS');
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'TRAVIS_PULL_REQUEST' ? 'false' : undefined
      );
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(false);
    });
  });

  describe('CircleCI detection', () => {
    it('should detect CircleCI', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'CIRCLECI');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'CIRCLECI');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('circleci');
      expect(result.name).toBe('CircleCI');
    });

    it('should detect pull request with CIRCLE_PULL_REQUEST', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'CIRCLECI');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'CIRCLECI' || key === 'CIRCLE_PULL_REQUEST');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });

    it('should detect pull request with CIRCLE_PR_NUMBER', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'CIRCLECI');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'CIRCLECI' || key === 'CIRCLE_PR_NUMBER');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });
  });

  describe('Jenkins detection', () => {
    it('should detect Jenkins', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'JENKINS_URL');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('jenkins');
      expect(result.name).toBe('Jenkins');
    });

    it('should detect pull request with CHANGE_ID', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'JENKINS_URL' || key === 'CHANGE_ID'
      );
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });

    it('should detect GitHub PR plugin', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'JENKINS_URL' || key === 'ghprbPullId'
      );
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });
  });

  describe('Azure Pipelines detection', () => {
    it('should detect Azure Pipelines', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'TF_BUILD');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'TF_BUILD');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('azure-pipelines');
      expect(result.name).toBe('Azure Pipelines');
    });

    it('should detect pull request', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'TF_BUILD');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'TF_BUILD' || key === 'SYSTEM_PULLREQUEST_PULLREQUESTID');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });
  });

  describe('Bitbucket Pipelines detection', () => {
    beforeEach(() => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'BITBUCKET_BUILD_NUMBER');
    });

    it('should detect Bitbucket Pipelines', () => {
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('bitbucket-pipelines');
      expect(result.name).toBe('Bitbucket Pipelines');
    });

    it('should detect pull request', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'BITBUCKET_BUILD_NUMBER' || key === 'BITBUCKET_PR_ID'
      );
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });
  });

  describe('TeamCity detection', () => {
    beforeEach(() => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'TEAMCITY_VERSION');
    });

    it('should detect TeamCity', () => {
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('teamcity');
      expect(result.name).toBe('TeamCity');
    });

    it('should detect pull request', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'TEAMCITY_VERSION' || key === 'TEAMCITY_PULL_REQUEST_NUMBER'
      );
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });
  });

  describe('AppVeyor detection', () => {
    it('should detect AppVeyor', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'APPVEYOR');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'APPVEYOR');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('appveyor');
      expect(result.name).toBe('AppVeyor');
    });

    it('should detect pull request', () => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'APPVEYOR');
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'APPVEYOR' || key === 'APPVEYOR_PULL_REQUEST_NUMBER');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });
  });

  describe('AWS CodeBuild detection', () => {
    beforeEach(() => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'CODEBUILD_BUILD_ID');
    });

    it('should detect AWS CodeBuild', () => {
      const result = detector.detect() as CIInfo;
      
      expect(result.isCI).toBe(true);
      expect(result.provider).toBe('codebuild');
      expect(result.name).toBe('AWS CodeBuild');
    });

    it('should detect pull request', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'CODEBUILD_BUILD_ID' || key === 'CODEBUILD_WEBHOOK_HEAD_REF'
      );
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'CODEBUILD_WEBHOOK_HEAD_REF' ? 'refs/pull/123/head' : undefined
      );
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });

    it('should not detect PR for non-pull request refs', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => 
        key === 'CODEBUILD_BUILD_ID' || key === 'CODEBUILD_WEBHOOK_HEAD_REF'
      );
      mockProcessUtils.getEnv.mockImplementation((key) => 
        key === 'CODEBUILD_WEBHOOK_HEAD_REF' ? 'refs/heads/main' : undefined
      );
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(false);
    });
  });

  describe('Generic PR detection', () => {
    beforeEach(() => {
      mockProcessUtils.getEnvBoolean.mockImplementation((key) => key === 'CI');
    });

    it('should detect PR with PR_NUMBER', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'PR_NUMBER');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });

    it('should detect PR with PULL_REQUEST_ID', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'PULL_REQUEST_ID');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });

    it('should detect PR with PULL_REQUEST', () => {
      mockProcessUtils.hasEnv.mockImplementation((key) => key === 'PULL_REQUEST');
      
      const result = detector.detect() as CIInfo;
      
      expect(result.isPR).toBe(true);
    });
  });
});