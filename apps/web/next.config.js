const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'res.cloudinary.com'],
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: 'http://localhost:3001/api/auth/:path*',
      },
      {
        source: '/api/products/:path*',
        destination: 'http://localhost:3002/api/products/:path*',
      },
      {
        source: '/api/orders/:path*',
        destination: 'http://localhost:3003/api/orders/:path*',
      },
      {
        source: '/api/payments/:path*',
        destination: 'http://localhost:3004/api/payments/:path*',
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);