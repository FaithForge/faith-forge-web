if (!self.define) {
  let e,
    s = {};
  const n = (n, a) => (
    (n = new URL(n + '.js', a).href),
    s[n] ||
      new Promise((s) => {
        if ('document' in self) {
          const e = document.createElement('script');
          (e.src = n), (e.onload = s), document.head.appendChild(e);
        } else (e = n), importScripts(n), s();
      }).then(() => {
        let e = s[n];
        if (!e) throw new Error(`Module ${n} didn’t register its module`);
        return e;
      })
  );
  self.define = (a, i) => {
    const c =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href;
    if (s[c]) return;
    let t = {};
    const r = (e) => n(e, c),
      o = { module: { uri: c }, exports: t, require: r };
    s[c] = Promise.all(a.map((e) => o[e] || r(e))).then((e) => (i(...e), t));
  };
}
define(['./workbox-495fd258'], function (e) {
  'use strict';
  importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/static/B0eVcI0rAeA_p4QaaueZg/_buildManifest.js',
          revision: 'a296006a911be42db708b96e932ebc02',
        },
        {
          url: '/_next/static/B0eVcI0rAeA_p4QaaueZg/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/_next/static/chunks/2b1732cc-6dd173b410a1f8c2.js',
          revision: '6dd173b410a1f8c2',
        },
        {
          url: '/_next/static/chunks/434-d0bba7f9bf658848.js',
          revision: 'd0bba7f9bf658848',
        },
        {
          url: '/_next/static/chunks/504-842248c4585d1e7c.js',
          revision: '842248c4585d1e7c',
        },
        {
          url: '/_next/static/chunks/637-0179cf52966f7c85.js',
          revision: '0179cf52966f7c85',
        },
        {
          url: '/_next/static/chunks/6694a724-35fec1c2a3cb38d2.js',
          revision: '35fec1c2a3cb38d2',
        },
        {
          url: '/_next/static/chunks/7955c542-56dbc47355e8d85c.js',
          revision: '56dbc47355e8d85c',
        },
        {
          url: '/_next/static/chunks/801-9a6ee7c6ddc8760a.js',
          revision: '9a6ee7c6ddc8760a',
        },
        {
          url: '/_next/static/chunks/87d427d2-d11bb836e70f05c0.js',
          revision: 'd11bb836e70f05c0',
        },
        {
          url: '/_next/static/chunks/88fffc7f-d639423ecc6ae567.js',
          revision: 'd639423ecc6ae567',
        },
        {
          url: '/_next/static/chunks/944-c9847610b601b50f.js',
          revision: 'c9847610b601b50f',
        },
        {
          url: '/_next/static/chunks/9c3c61ee-5d5dbefb0c0dbe8f.js',
          revision: '5d5dbefb0c0dbe8f',
        },
        {
          url: '/_next/static/chunks/be19e350-b41fe339c70cc36b.js',
          revision: 'b41fe339c70cc36b',
        },
        {
          url: '/_next/static/chunks/df42570e-a521104ad868c30b.js',
          revision: 'a521104ad868c30b',
        },
        {
          url: '/_next/static/chunks/f0845887-5fa7809d4a32b749.js',
          revision: '5fa7809d4a32b749',
        },
        {
          url: '/_next/static/chunks/framework-6dd3bf7463386647.js',
          revision: '6dd3bf7463386647',
        },
        {
          url: '/_next/static/chunks/main-1fc7d84357be6e2e.js',
          revision: '1fc7d84357be6e2e',
        },
        {
          url: '/_next/static/chunks/pages/_app-b151b946a73ea164.js',
          revision: 'b151b946a73ea164',
        },
        {
          url: '/_next/static/chunks/pages/_error-fdc5cf1f34cb592f.js',
          revision: 'fdc5cf1f34cb592f',
        },
        {
          url: '/_next/static/chunks/pages/_setup-5d25ec87eb096328.js',
          revision: '5d25ec87eb096328',
        },
        {
          url: '/_next/static/chunks/pages/index-a9be4b42544a0e58.js',
          revision: 'a9be4b42544a0e58',
        },
        {
          url: '/_next/static/chunks/pages/kid-church-dc45f65864651d9f.js',
          revision: 'dc45f65864651d9f',
        },
        {
          url: '/_next/static/chunks/pages/login-06f26449890ed2f0.js',
          revision: '06f26449890ed2f0',
        },
        {
          url: '/_next/static/chunks/pages/registration-9e0b8c4c471354d4.js',
          revision: '9e0b8c4c471354d4',
        },
        {
          url: '/_next/static/chunks/pages/registration/generateQRKidGuardian-af8561017e1c3862.js',
          revision: 'af8561017e1c3862',
        },
        {
          url: '/_next/static/chunks/pages/registration/newKid-3ef181435f89f340.js',
          revision: '3ef181435f89f340',
        },
        {
          url: '/_next/static/chunks/pages/registration/qrReader-340c94e00a002ab4.js',
          revision: '340c94e00a002ab4',
        },
        {
          url: '/_next/static/chunks/pages/registration/registerKid-d97700221fc7aee7.js',
          revision: 'd97700221fc7aee7',
        },
        {
          url: '/_next/static/chunks/pages/registration/updateKid-f02f5faefb14a5bf.js',
          revision: 'f02f5faefb14a5bf',
        },
        {
          url: '/_next/static/chunks/pages/settings-8ca548d96a7806a8.js',
          revision: '8ca548d96a7806a8',
        },
        {
          url: '/_next/static/chunks/pages/settings/churchInfo-e8b287e1617049a5.js',
          revision: 'e8b287e1617049a5',
        },
        {
          url: '/_next/static/chunks/pages/settings/generateChurchDayReport-ab61ab4420e3d0ee.js',
          revision: 'ab61ab4420e3d0ee',
        },
        {
          url: '/_next/static/chunks/pages/settings/generateChurchMeetingReport-4448a66e73986d66.js',
          revision: '4448a66e73986d66',
        },
        {
          url: '/_next/static/chunks/pages/settings/personalInfo-c609721741078ab4.js',
          revision: 'c609721741078ab4',
        },
        {
          url: '/_next/static/chunks/pages/settings/printerInfo-8aaf7b2915862f90.js',
          revision: '8aaf7b2915862f90',
        },
        {
          url: '/_next/static/chunks/pages/settings/users-d16c6b8a5c27b412.js',
          revision: 'd16c6b8a5c27b412',
        },
        {
          url: '/_next/static/chunks/pages/settings/users/edit-a20f4a5d8e0dfb5a.js',
          revision: 'a20f4a5d8e0dfb5a',
        },
        {
          url: '/_next/static/chunks/polyfills-78c92fac7aa8fdd8.js',
          revision: '79330112775102f91e1010318bae2bd3',
        },
        {
          url: '/_next/static/chunks/webpack-62c02dad1a6a4cb4.js',
          revision: '62c02dad1a6a4cb4',
        },
        {
          url: '/_next/static/css/682dc0d23674637b.css',
          revision: '682dc0d23674637b',
        },
        {
          url: '/_next/static/media/56d4c7a1c09c3371-s.woff2',
          revision: '43b1d1276722d640d51608db4600bb69',
        },
        {
          url: '/_next/static/media/7e6a2e30184bb114-s.p.woff2',
          revision: 'bca21fe1983e7d9137ef6e68e05f3aee',
        },
        {
          url: '/icons/boy-v2.png',
          revision: '1c89e4981ee5e494deb1c5a43071df92',
        },
        { url: '/icons/boy.png', revision: '1fd9f273dc4a94f629a647d75f5d5b7e' },
        {
          url: '/icons/browserconfig.xml',
          revision: '653d077300a12f09a69caeea7a8947f8',
        },
        {
          url: '/icons/female.png',
          revision: 'a975934bb378afc4ca8c133df451f56e',
        },
        {
          url: '/icons/girl-v2.png',
          revision: '089f735433294675fb93d8afa68fab17',
        },
        {
          url: '/icons/girl.png',
          revision: 'd0a2504531e3c371538523fc222819d6',
        },
        {
          url: '/icons/icon-192x192.png',
          revision: '11992590b6b3458b855a4caf2de2b880',
        },
        {
          url: '/icons/icon-256x256.png',
          revision: 'daa3dc4be270e560ca8966d9a27fe8f7',
        },
        {
          url: '/icons/icon-384x384.png',
          revision: '43a7c064a3805c31a48382c916a747b8',
        },
        {
          url: '/icons/icon-512x512.png',
          revision: 'df47033af15ce4c2605e72db5aeb5e68',
        },
        {
          url: '/icons/icondev-192x192.png',
          revision: 'a983c7534fc278737f84c9e1fd563c95',
        },
        {
          url: '/icons/icondev-256x256.png',
          revision: 'ecb0d575fecb9d523eff66af440fdefd',
        },
        {
          url: '/icons/icondev-384x384.png',
          revision: 'd85f10b5a194d42945654dfee549352e',
        },
        {
          url: '/icons/icondev-512x512.png',
          revision: '46dd356f3ca825b1fe3da1165579e8de',
        },
        {
          url: '/icons/male.png',
          revision: '86d9a87b262e90f5d3d01267a4a6233a',
        },
        {
          url: '/icons/manifest.json',
          revision: 'b58fcfa7628c9205cb11a1b2c3e8f99a',
        },
        {
          url: '/logo-iglekids.png',
          revision: 'd9cb3caa52fa93a719c81d9f77a960aa',
        },
        {
          url: '/manifest-dev.json',
          revision: '21987da735cb4e5da045ef2473d2db80',
        },
        { url: '/manifest.json', revision: '736470f99ae738bed7fe28d63f1f42b3' },
        { url: '/next.svg', revision: '8e061864f388b47f33a1c3780831193e' },
        { url: '/vercel.svg', revision: '61c6b19abff40ea7acd577be818f3976' },
      ],
      { ignoreURLParametersMatching: [] },
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: s,
              event: n,
              state: a,
            }) =>
              s && 'opaqueredirect' === s.type
                ? new Response(s.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: s.headers,
                  })
                : s,
          },
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: 'static-data-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        const s = e.pathname;
        return !s.startsWith('/api/auth/') && !!s.startsWith('/api/');
      },
      new e.NetworkFirst({
        cacheName: 'apis',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1;
        return !e.pathname.startsWith('/api/');
      },
      new e.NetworkFirst({
        cacheName: 'others',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET',
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: 'cross-origin',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      'GET',
    );
});
