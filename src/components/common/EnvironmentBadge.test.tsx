import React from 'react';
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EnvironmentBadge from './EnvironmentBadge';
import * as environmentUtils from '@/libs/utils/environment';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('EnvironmentBadge Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders nothing when running in production (isTestOrLocal is false)', () => {
    vi.spyOn(environmentUtils, 'getEnvironmentInfo').mockReturnValue({
      isTestOrLocal: false,
      isLocalhost: false,
      isStagingOrPreview: false,
      environmentName: 'PRODUCCIÓN',
      apiBaseUrl: 'https://api.faithforge.com',
      hostname: 'faith-forge.jucarlospm.com',
      mode: 'production',
    });

    const { container } = render(<EnvironmentBadge />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the badge pill when in local environment', () => {
    vi.spyOn(environmentUtils, 'getEnvironmentInfo').mockReturnValue({
      isTestOrLocal: true,
      isLocalhost: true,
      isStagingOrPreview: false,
      environmentName: 'LOCAL',
      apiBaseUrl: 'http://localhost:3000',
      hostname: 'localhost',
      mode: 'development',
    });

    render(<EnvironmentBadge />);

    const badgePill = screen.getByTestId('environment-badge-pill');
    expect(badgePill).toBeInTheDocument();
    expect(screen.getByText('LOCAL')).toBeInTheDocument();
  });

  it('opens and closes the diagnostic popover when clicking the badge', () => {
    vi.spyOn(environmentUtils, 'getEnvironmentInfo').mockReturnValue({
      isTestOrLocal: true,
      isLocalhost: false,
      isStagingOrPreview: true,
      environmentName: 'PRUEBAS',
      apiBaseUrl: 'https://api-staging.faithforge.com',
      hostname: 'staging.faithforge.com',
      mode: 'staging',
    });

    render(<EnvironmentBadge />);

    const badgePill = screen.getByTestId('environment-badge-pill');
    fireEvent.click(badgePill);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('staging.faithforge.com')).toBeInTheDocument();
    expect(screen.getByText('https://api-staging.faithforge.com')).toBeInTheDocument();

    const closeButtons = screen.getAllByRole('button', { name: 'environment.close' });
    fireEvent.click(closeButtons[0]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('toggles minimize state and persists to localStorage', () => {
    vi.spyOn(environmentUtils, 'getEnvironmentInfo').mockReturnValue({
      isTestOrLocal: true,
      isLocalhost: true,
      isStagingOrPreview: false,
      environmentName: 'LOCAL',
      apiBaseUrl: 'http://localhost:3000',
      hostname: 'localhost',
      mode: 'development',
    });

    render(<EnvironmentBadge />);

    const minimizeBtn = screen.getByRole('button', { name: 'environment.minimize' });
    fireEvent.click(minimizeBtn);

    expect(localStorage.getItem('ff_env_badge_minimized')).toBe('true');
    expect(screen.queryByTestId('environment-badge-pill')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'environment.badge_tooltip' })).toBeInTheDocument();
  });
});
