const prod = process.env.NODE_ENV === 'production';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  disable: prod ? false : true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
  transpilePackages: ['react-vant'],
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/', // reemplaza con la nueva ruta
        permanent: true,
      },
    ];
  },
});
