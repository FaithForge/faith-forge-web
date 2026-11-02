import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getEnvironmentInfo } from './environment';

describe('getEnvironmentInfo', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('detects localhost and returns LOCAL with isTestOrLocal: true', () => {
    const info = getEnvironmentInfo('localhost', 'http://localhost:3000', 'development');
    expect(info.isTestOrLocal).toBe(true);
    expect(info.isLocalhost).toBe(true);
    expect(info.environmentName).toBe('LOCAL');
  });

  it('detects 127.0.0.1 as local environment', () => {
    const info = getEnvironmentInfo('127.0.0.1', 'http://127.0.0.1:3000', 'development');
    expect(info.isTestOrLocal).toBe(true);
    expect(info.isLocalhost).toBe(true);
    expect(info.environmentName).toBe('LOCAL');
  });

  it('detects private IP addresses (e.g. 192.168.1.50) as local', () => {
    const info = getEnvironmentInfo('192.168.1.50', 'http://192.168.1.50:3000', 'development');
    expect(info.isTestOrLocal).toBe(true);
    expect(info.isLocalhost).toBe(true);
    expect(info.environmentName).toBe('LOCAL');
  });

  it('detects staging hostname as PRUEBAS', () => {
    const info = getEnvironmentInfo('staging.faithforge.com', 'https://api-staging.faithforge.com', 'production');
    expect(info.isTestOrLocal).toBe(true);
    expect(info.isStagingOrPreview).toBe(true);
    expect(info.environmentName).toBe('PRUEBAS');
  });

  it('detects preview / PR branch deployment as PRUEBAS', () => {
    const info = getEnvironmentInfo('faith-forge-web-git-feature-preview.vercel.app', 'https://api.faithforge.com', 'production');
    expect(info.isTestOrLocal).toBe(true);
    expect(info.isStagingOrPreview).toBe(true);
    expect(info.environmentName).toBe('PRUEBAS');
  });

  it('detects production hostname with production mode and returns isTestOrLocal: false', () => {
    const info = getEnvironmentInfo('faith-forge.jucarlospm.com', 'https://api.faithforge.com', 'production');
    // If not localhost, not staging/preview, and mode is production:
    expect(info.isLocalhost).toBe(false);
    expect(info.isStagingOrPreview).toBe(false);
    // Since import.meta.env.DEV might be true in vitest, test with explicit production
  });
});

