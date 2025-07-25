import * as os from 'os';
import type { ContainerInfo } from '@/types';
import { BaseDetector } from '@/core/detector';
import { CONTAINER_FILES, WSL_INDICATORS } from '@/core/constants';
import { fileExists, readFile, isDirectory } from '@/utils/file';
import { getEnv, hasEnv } from '@/utils/process';

export class ContainerDetector extends BaseDetector<ContainerInfo> {
  public readonly name = 'container';

  protected performDetection(): ContainerInfo {
    const isDocker = this.detectDocker();
    const wslInfo = this.detectWSL();
    const isKubernetes = this.detectKubernetes();
    const isContainer = isDocker || wslInfo.isWSL || isKubernetes;

    let containerType: ContainerInfo['containerType'];
    if (isDocker) {
      containerType = 'docker';
    } else if (wslInfo.isWSL) {
      containerType = 'wsl';
    } else if (isKubernetes) {
      containerType = 'kubernetes';
    }
    // Note: The following condition is unreachable because isContainer = isDocker || wslInfo.isWSL || isKubernetes
    // else if (isContainer) {
    //   containerType = 'unknown';
    // }

    return {
      isContainer,
      isDocker,
      isWSL: wslInfo.isWSL,
      isKubernetes,
      containerType,
      wslVersion: wslInfo.version,
      wslDistro: wslInfo.distro,
    };
  }

  private detectDocker(): boolean {
    // Check for Docker-specific files
    if (fileExists(CONTAINER_FILES.DOCKER_ENV) || fileExists(CONTAINER_FILES.DOCKER_INIT)) {
      return true;
    }

    // Check cgroup for docker
    const cgroupPath = '/proc/self/cgroup';
    const cgroupContent = readFile(cgroupPath);
    if (cgroupContent && (cgroupContent.includes('docker') || cgroupContent.includes('containerd'))) {
      return true;
    }

    // Check for Docker in /proc/1/cgroup
    const initCgroupContent = readFile('/proc/1/cgroup');
    if (initCgroupContent && (initCgroupContent.includes('docker') || initCgroupContent.includes('containerd'))) {
      return true;
    }

    // Check mountinfo for docker
    const mountInfo = readFile('/proc/self/mountinfo');
    if (mountInfo && mountInfo.includes('docker')) {
      return true;
    }

    return false;
  }

  private detectWSL(): { isWSL: boolean; version?: number; distro?: string } {
    // Windows doesn't have WSL when running natively
    if (os.platform() === 'win32') {
      return { isWSL: false };
    }

    // Check environment variable
    const wslDistro = getEnv(WSL_INDICATORS.ENV_VAR);
    if (wslDistro) {
      return {
        isWSL: true,
        version: this.getWSLVersion(),
        distro: wslDistro,
      };
    }

    // Check /proc/version for Microsoft
    const procVersion = readFile('/proc/version');
    if (procVersion && procVersion.toLowerCase().includes(WSL_INDICATORS.PROC_VERSION.toLowerCase())) {
      return {
        isWSL: true,
        version: this.getWSLVersion(),
        distro: this.getWSLDistro(),
      };
    }

    // Check for WSL interop file
    if (fileExists(WSL_INDICATORS.PROC_SYS) || isDirectory(CONTAINER_FILES.WSL_INTEROP)) {
      return {
        isWSL: true,
        version: this.getWSLVersion(),
        distro: this.getWSLDistro(),
      };
    }

    // Check for WSL-specific environment variables
    if (hasEnv('WSLENV') || hasEnv('WSL_INTEROP')) {
      return {
        isWSL: true,
        version: this.getWSLVersion(),
        distro: this.getWSLDistro(),
      };
    }

    return { isWSL: false };
  }

  private detectKubernetes(): boolean {
    // Check for Kubernetes service account
    if (isDirectory(CONTAINER_FILES.KUBERNETES_SERVICE)) {
      return true;
    }

    // Check for Kubernetes environment variables
    if (hasEnv('KUBERNETES_SERVICE_HOST') || hasEnv('KUBERNETES_PORT')) {
      return true;
    }

    // Check hostname for k8s pattern
    const hostname = os.hostname();
    if (hostname && /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+(-[a-z0-9]+)*$/.test(hostname)) {
      // Additional check for Kubernetes-specific files
      if (fileExists('/var/run/secrets/kubernetes.io/serviceaccount/token')) {
        return true;
      }
    }

    return false;
  }

  private getWSLVersion(): number | undefined {
    // WSL 2 has a specific kernel version pattern
    const procVersion = readFile('/proc/version');
    if (procVersion) {
      if (procVersion.includes('WSL2') || procVersion.includes('microsoft-standard-WSL2')) {
        return 2;
      }
      if (procVersion.includes('Microsoft') || procVersion.includes('WSL')) {
        // Check kernel version for WSL 2 (5.x kernels are WSL 2)
        const kernelMatch = procVersion.match(/(\d+)\.(\d+)\.(\d+)/);
        if (kernelMatch) {
          const majorVersion = parseInt(kernelMatch[1] || '0', 10);
          if (majorVersion >= 5) {
            return 2;
          }
        }
        return 1;
      }
    }
    return undefined;
  }

  private getWSLDistro(): string | undefined {
    // First check environment variable
    const envDistro = getEnv(WSL_INDICATORS.ENV_VAR);
    if (envDistro) {
      return envDistro;
    }

    // Try to read from /etc/os-release
    const osRelease = readFile('/etc/os-release');
    if (osRelease) {
      const nameMatch = osRelease.match(/^NAME="?(.+?)"?$/m);
      if (nameMatch) {
        return nameMatch[1];
      }
    }

    return undefined;
  }
}