import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Ecommerce Store',
    template: '%s | Ecommerce Store',
  },
  description: 'Modern, scalable e-commerce platform built with Next.js',
  keywords: ['ecommerce', 'shopping', 'online store', 'retail'],
  authors: [{ name: 'Ecommerce Team' }],
  creator: 'Ecommerce Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ecommerce-store.com',
    siteName: 'Ecommerce Store',
    title: 'Ecommerce Store',
    description: 'Modern, scalable e-commerce platform built with Next.js',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Ecommerce Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ecommerce Store',
    description: 'Modern, scalable e-commerce platform built with Next.js',
    images: ['/og-image.jpg'],
    creator: '@ecommerce',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'hsl(var(--card))',
                color: 'hsl(var(--card-foreground))',
                border: '1px solid hsl(var(--border))',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}