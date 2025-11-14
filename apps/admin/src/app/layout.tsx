import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Admin Dashboard - Ecommerce',
    template: '%s | Admin Dashboard',
  },
  description: 'Administrative dashboard for e-commerce platform management',
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased custom-scrollbar`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'rgba(255, 255, 255, 0.95)',
                color: '#1f2937',
                border: '1px solid rgba(229, 231, 235, 0.5)',
                borderRadius: '12px',
                backdropFilter: 'blur(8px)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
              },
              success: {
                style: {
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#065f46',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                },
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                style: {
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#991b1b',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                },
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}