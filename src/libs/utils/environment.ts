import { API_BASE_URL } from '@/libs/common-types/global/http';

export interface EnvironmentInfo {
  isTestOrLocal: boolean;
  isLocalhost: boolean;
  isStagingOrPreview: boolean;
  environmentName: string;
  apiBaseUrl: string;
  hostname: string;
  mode: string;
}

/**
 * Evaluates whether the current instance is running in a local, development, or staging/preview environment.
 * Checks Vite environment modes, current browser hostname (localhost, private IPs, preview domains), and API target.
 *
 * @param {string} [overrideHostname] - Optional hostname string for testing or SSR.
 * @param {string} [overrideApiBaseUrl] - Optional API base URL for testing.
 * @param {string} [overrideMode] - Optional Vite mode for testing.
 * @returns {EnvironmentInfo} Structured diagnostic information about the current environment.
 */
export const getEnvironmentInfo = (
  overrideHostname?: string,
  overrideApiBaseUrl?: string,
  overrideMode?: string,
): EnvironmentInfo => {
  const mode = overrideMode || import.meta.env.MODE || 'production';
  const isDevMode = import.meta.env.DEV || mode === 'development';
  const explicitAppEnv = (import.meta.env.VITE_APP_ENV || '').toLowerCase();

  const hostname = (
    overrideHostname ||
    (typeof window !== 'undefined' ? window.location.hostname : '')
  )
    .toLowerCase()
    .trim();

  const apiBaseUrl = (overrideApiBaseUrl || API_BASE_URL || '').toLowerCase();

  // Localhost or private network detection
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    /^192\.168\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    apiBaseUrl.includes('localhost') ||
    apiBaseUrl.includes('127.0.0.1');

  // Staging, dev, or preview detection (e.g. *.vercel.app, staging.*, dev.*, test.*)
  const isStagingOrPreview =
    hostname.includes('staging') ||
    hostname.includes('dev.') ||
    hostname.includes('test.') ||
    hostname.includes('preview') ||
    hostname.includes('-git-') ||
    (hostname.endsWith('.vercel.app') && !hostname.startsWith('faith-forge')) ||
    apiBaseUrl.includes('staging') ||
    apiBaseUrl.includes('dev.') ||
    explicitAppEnv === 'staging' ||
    explicitAppEnv === 'test' ||
    explicitAppEnv === 'development' ||
    explicitAppEnv === 'local';

  // Explicit production flag disables the banner
  const isExplicitProduction = explicitAppEnv === 'production';

  const isTestOrLocal =
    !isExplicitProduction &&
    (isDevMode || isLocalhost || isStagingOrPreview || mode !== 'production');

  let environmentName = 'PRODUCCIÓN';
  if (isLocalhost) {
    environmentName = 'LOCAL';
  } else if (isStagingOrPreview) {
    environmentName = 'PRUEBAS';
  } else if (isTestOrLocal) {
    environmentName = 'DEV';
  }

  return {
    isTestOrLocal,
    isLocalhost,
    isStagingOrPreview,
    environmentName,
    apiBaseUrl: overrideApiBaseUrl || API_BASE_URL || '',
    hostname,
    mode,
  };
};

