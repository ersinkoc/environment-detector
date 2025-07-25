import {
  DEFAULT_CACHE_TIMEOUT,
  CI_ENV_VARS,
  CI_PROVIDER_ENV_VARS,
  CLOUD_ENV_VARS,
  CONTAINER_FILES,
  WSL_INDICATORS,
  NODE_ENV_VALUES,
} from '../../../src/core/constants';

describe('Constants', () => {
  describe('DEFAULT_CACHE_TIMEOUT', () => {
    it('should be set to 60000 (1 minute)', () => {
      expect(DEFAULT_CACHE_TIMEOUT).toBe(60000);
    });

    it('should be a positive number', () => {
      expect(DEFAULT_CACHE_TIMEOUT).toBeGreaterThan(0);
    });
  });

  describe('CI_ENV_VARS', () => {
    it('should contain standard CI environment variables', () => {
      expect(CI_ENV_VARS.CI).toBe('CI');
      expect(CI_ENV_VARS.CONTINUOUS_INTEGRATION).toBe('CONTINUOUS_INTEGRATION');
      expect(CI_ENV_VARS.BUILD_NUMBER).toBe('BUILD_NUMBER');
      expect(CI_ENV_VARS.CI_NAME).toBe('CI_NAME');
    });

    it('should be a frozen object', () => {
      expect(Object.isFrozen(CI_ENV_VARS)).toBe(true);
    });

    it('should have exactly 4 properties', () => {
      expect(Object.keys(CI_ENV_VARS)).toHaveLength(4);
    });
  });

  describe('CI_PROVIDER_ENV_VARS', () => {
    it('should contain all major CI provider environment variables', () => {
      expect(CI_PROVIDER_ENV_VARS.GITHUB_ACTIONS).toBe('GITHUB_ACTIONS');
      expect(CI_PROVIDER_ENV_VARS.GITLAB_CI).toBe('GITLAB_CI');
      expect(CI_PROVIDER_ENV_VARS.TRAVIS).toBe('TRAVIS');
      expect(CI_PROVIDER_ENV_VARS.CIRCLECI).toBe('CIRCLECI');
      expect(CI_PROVIDER_ENV_VARS.JENKINS_URL).toBe('JENKINS_URL');
      expect(CI_PROVIDER_ENV_VARS.BITBUCKET_BUILD_NUMBER).toBe('BITBUCKET_BUILD_NUMBER');
      expect(CI_PROVIDER_ENV_VARS.TEAMCITY_VERSION).toBe('TEAMCITY_VERSION');
      expect(CI_PROVIDER_ENV_VARS.APPVEYOR).toBe('APPVEYOR');
      expect(CI_PROVIDER_ENV_VARS.CODEBUILD_BUILD_ID).toBe('CODEBUILD_BUILD_ID');
      expect(CI_PROVIDER_ENV_VARS.TF_BUILD).toBe('TF_BUILD');
    });

    it('should be a frozen object', () => {
      expect(Object.isFrozen(CI_PROVIDER_ENV_VARS)).toBe(true);
    });

    it('should have exactly 10 properties', () => {
      expect(Object.keys(CI_PROVIDER_ENV_VARS)).toHaveLength(10);
    });
  });

  describe('CLOUD_ENV_VARS', () => {
    it('should contain AWS Lambda environment variables', () => {
      expect(CLOUD_ENV_VARS.AWS_LAMBDA_FUNCTION_NAME).toBe('AWS_LAMBDA_FUNCTION_NAME');
      expect(CLOUD_ENV_VARS.AWS_EXECUTION_ENV).toBe('AWS_EXECUTION_ENV');
      expect(CLOUD_ENV_VARS.AWS_REGION).toBe('AWS_REGION');
    });

    it('should contain Google Cloud environment variables', () => {
      expect(CLOUD_ENV_VARS.FUNCTION_NAME).toBe('FUNCTION_NAME');
      expect(CLOUD_ENV_VARS.K_SERVICE).toBe('K_SERVICE');
    });

    it('should contain Azure Functions environment variables', () => {
      expect(CLOUD_ENV_VARS.WEBSITE_SITE_NAME).toBe('WEBSITE_SITE_NAME');
    });

    it('should contain Vercel environment variables', () => {
      expect(CLOUD_ENV_VARS.VERCEL).toBe('VERCEL');
      expect(CLOUD_ENV_VARS.VERCEL_ENV).toBe('VERCEL_ENV');
    });

    it('should contain other cloud provider environment variables', () => {
      expect(CLOUD_ENV_VARS.NETLIFY).toBe('NETLIFY');
      expect(CLOUD_ENV_VARS.CF_WORKER).toBe('CF_WORKER');
    });

    it('should be a frozen object', () => {
      expect(Object.isFrozen(CLOUD_ENV_VARS)).toBe(true);
    });

    it('should have exactly 10 properties', () => {
      expect(Object.keys(CLOUD_ENV_VARS)).toHaveLength(10);
    });
  });

  describe('CONTAINER_FILES', () => {
    it('should contain Docker file paths', () => {
      expect(CONTAINER_FILES.DOCKER_ENV).toBe('/.dockerenv');
      expect(CONTAINER_FILES.DOCKER_INIT).toBe('/.dockerinit');
    });

    it('should contain WSL file paths', () => {
      expect(CONTAINER_FILES.WSL_INTEROP).toBe('/run/WSL');
    });

    it('should contain Kubernetes file paths', () => {
      expect(CONTAINER_FILES.KUBERNETES_SERVICE).toBe('/var/run/secrets/kubernetes.io');
    });

    it('should be a frozen object', () => {
      expect(Object.isFrozen(CONTAINER_FILES)).toBe(true);
    });

    it('should have exactly 4 properties', () => {
      expect(Object.keys(CONTAINER_FILES)).toHaveLength(4);
    });

    it('should have all values as absolute paths', () => {
      Object.values(CONTAINER_FILES).forEach(path => {
        expect(path).toMatch(/^\//);
      });
    });
  });

  describe('WSL_INDICATORS', () => {
    it('should contain WSL environment variable', () => {
      expect(WSL_INDICATORS.ENV_VAR).toBe('WSL_DISTRO_NAME');
    });

    it('should contain WSL proc version indicator', () => {
      expect(WSL_INDICATORS.PROC_VERSION).toBe('Microsoft');
    });

    it('should contain WSL proc sys path', () => {
      expect(WSL_INDICATORS.PROC_SYS).toBe('/proc/sys/fs/binfmt_misc/WSLInterop');
    });

    it('should be a frozen object', () => {
      expect(Object.isFrozen(WSL_INDICATORS)).toBe(true);
    });

    it('should have exactly 3 properties', () => {
      expect(Object.keys(WSL_INDICATORS)).toHaveLength(3);
    });
  });

  describe('NODE_ENV_VALUES', () => {
    it('should contain all standard Node.js environment values', () => {
      expect(NODE_ENV_VALUES.DEVELOPMENT).toBe('development');
      expect(NODE_ENV_VALUES.PRODUCTION).toBe('production');
      expect(NODE_ENV_VALUES.TEST).toBe('test');
      expect(NODE_ENV_VALUES.STAGING).toBe('staging');
    });

    it('should be a frozen object', () => {
      expect(Object.isFrozen(NODE_ENV_VALUES)).toBe(true);
    });

    it('should have exactly 4 properties', () => {
      expect(Object.keys(NODE_ENV_VALUES)).toHaveLength(4);
    });

    it('should have all values in lowercase', () => {
      Object.values(NODE_ENV_VALUES).forEach(value => {
        expect(value).toBe(value.toLowerCase());
      });
    });
  });

  describe('All constants', () => {
    it('should not have any overlapping values between different constant objects', () => {
      const allValues = [
        ...Object.values(CI_ENV_VARS),
        ...Object.values(CI_PROVIDER_ENV_VARS),
        ...Object.values(CLOUD_ENV_VARS),
        ...Object.values(CONTAINER_FILES),
        ...Object.values(WSL_INDICATORS),
        ...Object.values(NODE_ENV_VALUES),
      ];

      const uniqueValues = new Set(allValues);
      expect(uniqueValues.size).toBe(allValues.length);
    });
  });
});