/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    unoptimized: true,
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'res.cloudinary.com',
      'localhost',
      '127.0.0.1',
    ],
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
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8080',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
  },
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
        source: '/api/orders/:path*',
        destination: 'http://order-service:3003/api/orders/:path*',
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
      {
        source: '/api/payments/:path*',
        destination: 'http://payment-service:3004/api/payments/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

