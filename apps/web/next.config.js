const createNextIntlPlugin = require('next-intl/plugin');
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3002';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3004';
const STORE_SERVICE_URL = process.env.STORE_SERVICE_URL || 'http://store-service:3007';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${AUTH_SERVICE_URL}/api/auth/:path*`,
      },
      {
        source: '/api/products/:path*',
        destination: `${PRODUCT_SERVICE_URL}/api/products/:path*`,
      },
      {
        source: '/api/orders/:path*',
        destination: `${ORDER_SERVICE_URL}/api/orders/:path*`,
      },
      {
        source: '/api/payments/:path*',
        destination: `${PAYMENT_SERVICE_URL}/api/payments/:path*`,
      },
      {
        source: '/api/store/:path*',
        destination: `${STORE_SERVICE_URL}/api/v1/:path*`,
      },
      {
        source: '/api/stores/:path*',
        destination: `${STORE_SERVICE_URL}/api/v1/stores/:path*`,
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);