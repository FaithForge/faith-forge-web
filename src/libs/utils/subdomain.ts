/**
 * Utility functions for extracting and parsing multi-tenant subdomain information.
 * Supports production wildcards (*.lumbrela.app) as well as local development (sub.localhost).
 */

export interface SubdomainInfo {
  /** Raw subdomain string (e.g., 'casadedios', 'admin') or null if top-level */
  subdomain: string | null;
  /** Whether the current request is under a designated subdomain */
  isSubdomain: boolean;
  /** Whether the current hostname represents the global SaaS Platform Super Admin portal */
  isPlatformAdmin: boolean;
  /** Whether the current hostname represents a tenant church portal */
  isChurchTenant: boolean;
  /** Church slug identifier extracted from subdomain if tenant */
  churchSlug: string | null;
}

/**
 * Extracts and classifies tenant and admin subdomain information from current window hostname.
 *
 * @param {string} [overrideHostname] - Optional hostname string for testing or SSR.
 * @returns {SubdomainInfo} Structured subdomain information.
 */
const IP_V4_REGEX = new RegExp('^(\\d{1,3}\\.){3}\\d{1,3}$');

export const getSubdomainInfo = (overrideHostname?: string): SubdomainInfo => {
  if (typeof window === 'undefined' && !overrideHostname) {
    return {
      subdomain: null,
      isSubdomain: false,
      isPlatformAdmin: false,
      isChurchTenant: false,
      churchSlug: null,
    };
  }

  const hostname = (overrideHostname || window.location.hostname).toLowerCase().trim();

  // If IP address or plain localhost without subdomain
  if (!hostname || hostname === 'localhost' || IP_V4_REGEX.test(hostname)) {
    return {
      subdomain: null,
      isSubdomain: false,
      isPlatformAdmin: false,
      isChurchTenant: false,
      churchSlug: null,
    };
  }

  const parts = hostname.split('.');

  // Localhost with subdomain (e.g. admin.localhost or casadedios.localhost)
  if (parts.length === 2 && parts[1] === 'localhost') {
    const sub = parts[0];
    const isPlatformAdmin = sub === 'admin';
    const isChurchTenant = sub !== 'admin' && sub !== 'app' && sub !== 'www';

    return {
      subdomain: sub,
      isSubdomain: true,
      isPlatformAdmin,
      isChurchTenant,
      churchSlug: isChurchTenant ? sub : null,
    };
  }

  // Standard multi-part domain (e.g. casadedios.lumbrela.app or casadedios.faithforge.com)
  if (parts.length >= 3) {
    const sub = parts[0];
    // Ignore www as tenant
    if (sub === 'www') {
      return {
        subdomain: null,
        isSubdomain: false,
        isPlatformAdmin: false,
        isChurchTenant: false,
        churchSlug: null,
      };
    }

    const isPlatformAdmin = sub === 'admin';
    const isChurchTenant = sub !== 'admin' && sub !== 'app';

    return {
      subdomain: sub,
      isSubdomain: true,
      isPlatformAdmin,
      isChurchTenant,
      churchSlug: isChurchTenant ? sub : null,
    };
  }

  return {
    subdomain: null,
    isSubdomain: false,
    isPlatformAdmin: false,
    isChurchTenant: false,
    churchSlug: null,
  };
};
