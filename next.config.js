/** @type {import('next').NextConfig} */
const prod = process.env.NODE_ENV === 'production';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  disable: prod ? false : true,
  skipWaiting: true,
});

module.exports = withPWA({
  reactStrictMode: true,
  transpilePackages: ['antd-mobile'],
});
