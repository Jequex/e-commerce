/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/:locale(en|fr|es|de)/login',
        destination: '/login',
      },
      {
        source: '/:locale(en|fr|es|de)',
        destination: '/',
      },
      {
        source: '/api/auth/:path*',
        destination: 'http://auth-service:3001/api/auth/:path*',
      },
      {
        source: '/api/products/:path*',
        destination: 'http://product-service:3002/api/products/:path*',
      },
      {
        source: '/api/stores/:path*',
        destination: 'http://store-service:3007/api/v1/stores/:path*',
      },
      {
        source: '/api/store/:path*',
        destination: 'http://store-service:3007/api/v1/:path*',
      },
      {
        source: '/api/v1/:path*',
        destination: 'http://store-service:3007/api/v1/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

