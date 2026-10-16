import { IChurch, IChurchBranding } from '@/libs/models/Church';

export const TENANT_BRANDING_CACHE_KEY = 'ff_tenant_branding_cache';

export interface TenantHostContext {
  hostname: string;
  isSuperAdminHost: boolean;
  tenantSlug: string | null;
}

const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api']);

/**
 * Resolves the active host context from window.location (and optional ?tenant= query parameter for local dev).
 *
 * @returns {TenantHostContext} Parsed host context indicating whether it is the Superadmin console or a church tenant.
 */
export const resolveTenantHostContext = (): TenantHostContext => {
  if (typeof window === 'undefined') {
    return {
      hostname: '',
      isSuperAdminHost: false,
      tenantSlug: null,
    };
  }

  const rawHostname = window.location.hostname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const queryTenant = searchParams.get('tenant')?.trim().toLowerCase() || null;

  if (queryTenant === 'admin' || rawHostname.startsWith('admin.')) {
    return {
      hostname: rawHostname,
      isSuperAdminHost: true,
      tenantSlug: null,
    };
  }

  if (queryTenant && !RESERVED_SUBDOMAINS.has(queryTenant)) {
    return {
      hostname: rawHostname,
      isSuperAdminHost: false,
      tenantSlug: queryTenant,
    };
  }

  const isLocalOrIp =
    rawHostname === 'localhost' ||
    rawHostname === '127.0.0.1' ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(rawHostname) ||
    rawHostname.endsWith('.vercel.app');

  if (isLocalOrIp) {
    const localParts = rawHostname.split('.');
    if (localParts.length >= 2 && localParts[localParts.length - 1] === 'localhost') {
      const candidate = localParts[0];
      if (candidate === 'admin') {
        return {
          hostname: rawHostname,
          isSuperAdminHost: true,
          tenantSlug: null,
        };
      }
      if (candidate && !RESERVED_SUBDOMAINS.has(candidate)) {
        return {
          hostname: rawHostname,
          isSuperAdminHost: false,
          tenantSlug: candidate,
        };
      }
    }
    return {
      hostname: rawHostname,
      isSuperAdminHost: false,
      tenantSlug: null,
    };
  }

  const parts = rawHostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    if (subdomain && !RESERVED_SUBDOMAINS.has(subdomain)) {
      return {
        hostname: rawHostname,
        isSuperAdminHost: false,
        tenantSlug: subdomain,
      };
    }
  }

  return {
    hostname: rawHostname,
    isSuperAdminHost: false,
    tenantSlug: null,
  };
};

/**
 * Persists the active church's branding metadata in localStorage for instant pre-React splash screen rendering
 * and updates DOM document title, theme-color, apple-touch-icon, favicon, and CSS brand variables.
 *
 * @param {IChurch | null | undefined} church - Resolved church object.
 * @returns {void}
 */
export const applyChurchBrandingToDom = (church?: IChurch | null): void => {
  if (typeof document === 'undefined' || !church) return;

  const branding: IChurchBranding = church.branding || {};
  const appName = branding.appName || church.name || 'Iglekids';
  const shortName = branding.shortName || appName;
  const primaryColor = branding.primaryColor || '#2563EB';
  const themeColor = branding.themeColor || '#ffffff';
  const backgroundColor = branding.backgroundColor || '#ffffff';
  const icon192Url = branding.icon192Url || '/icons/icon-192x192.png';
  const appleTouchIconUrl = branding.appleTouchIconUrl || icon192Url;
  const logoUrl = branding.logoUrl || icon192Url || '/logo-iglekids.png';

  document.title = appName;

  const setMetaContent = (selector: string, content: string) => {
    const element = document.querySelector<HTMLMetaElement>(selector);
    if (element) element.setAttribute('content', content);
  };

  setMetaContent('meta[name="theme-color"]', themeColor);
  setMetaContent('meta[name="application-name"]', shortName);
  setMetaContent('meta[name="apple-mobile-web-app-title"]', shortName);

  const appleIconLink = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
  if (appleIconLink && appleTouchIconUrl) appleIconLink.href = appleTouchIconUrl;

  const icon192Link = document.querySelector<HTMLLinkElement>('link[rel="icon"][sizes="192x192"]');
  if (icon192Link && icon192Url) icon192Link.href = icon192Url;

  document.documentElement.style.setProperty('--church-primary', primaryColor);
  document.documentElement.style.setProperty('--church-theme', themeColor);
  document.documentElement.style.setProperty('--church-bg', backgroundColor);

  try {
    localStorage.setItem(
      TENANT_BRANDING_CACHE_KEY,
      JSON.stringify({
        churchId: church.id,
        slug: church.slug,
        appName,
        shortName,
        primaryColor,
        themeColor,
        backgroundColor,
        logoUrl,
        icon192Url,
        appleTouchIconUrl,
      }),
    );
  } catch {
    // Ignore storage quota errors
  }
};

/**
 * Reads the currently active church ID from localStorage cache or Vite fallback environment variable.
 *
 * @returns {string | undefined} Active church UUID if available.
 */
export const getActiveTenantChurchId = (): string | undefined => {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(TENANT_BRANDING_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as { churchId?: string };
        if (parsed?.churchId) return parsed.churchId;
      }
    } catch {
      // Ignore parse errors
    }
  }
  return import.meta.env.VITE_CHURCH_ID || undefined;
};
