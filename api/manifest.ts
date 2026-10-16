const DEFAULT_MANIFEST = {
  id: '/',
  name: 'Iglekids',
  short_name: 'Iglekids',
  description: 'Aplicativo para el registro y control de niños en Rios de Vida',
  theme_color: '#ffffff',
  background_color: '#ffffff',
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/',
  icons: [
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any',
    },
    {
      src: '/icons/maskable-icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'maskable',
    },
    {
      src: '/icons/maskable-icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};

/**
 * Vercel Serverless Function to dynamically generate the Web App Manifest per subdomain / custom domain.
 * Falls back to the default Iglekids manifest if the backend is unreachable or no tenant matches.
 *
 * @param {any} req - Incoming HTTP request
 * @param {any} res - Outgoing HTTP response
 * @returns {Promise<void>}
 */
export default async function handler(req: any, res: any): Promise<void> {
  const rawHost = String(req.headers['x-forwarded-host'] || req.headers['host'] || '')
    .split(',')[0]
    .trim()
    .toLowerCase()
    .split(':')[0];

  const querySlug = typeof req.query?.slug === 'string' ? req.query.slug.trim().toLowerCase() : '';
  const hostParts = rawHost.split('.');
  const derivedSubdomain =
    hostParts.length >= 3 && !['www', 'admin', 'app', 'api'].includes(hostParts[0]) ? hostParts[0] : '';
  const slug = querySlug || derivedSubdomain;

  const apiBaseUrl = (process.env.VITE_API_BASE_URL || 'https://api.lumbrela.app').replace(/\/+$/, '');

  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');

  try {
    const params = new URLSearchParams();
    if (slug) params.set('slug', slug);
    if (rawHost) params.set('host', rawHost);
    if (process.env.VITE_CHURCH_ID) params.set('churchId', process.env.VITE_CHURCH_ID);

    const response = await fetch(`${apiBaseUrl}/ms-church/church/public/manifest?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      const payload = await response.json();
      const manifestData = payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload;
      if (manifestData && typeof manifestData === 'object' && 'name' in manifestData) {
        res.status(200).send(JSON.stringify(manifestData));
        return;
      }
    }
  } catch {
    // Fallback to default manifest
  }

  res.status(200).send(JSON.stringify(DEFAULT_MANIFEST));
}
