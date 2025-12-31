import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import type { Metadata } from 'next';
import { Lato } from 'next/font/google';
import { Providers } from './providers';
import { ToastContainer } from 'react-toastify';

const lato = Lato({
  subsets: ['latin'],
  weight: ['100', '300', '400', '700', '900'],
  variable: '--font-lato',
});

export const metadata: Metadata = {
  title: {
    default: 'Jequex Store',
    template: '%s | Jequex Store',
  },
  description: 'Modern, scalable e-commerce platform built with Next.js',
  keywords: ['ecommerce', 'shopping', 'online store', 'retail'],
  authors: [{ name: 'Jequex Team' }],
  creator: 'Jequex Team',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://store.jequex.com',
    siteName: 'Jequex Store',
    title: 'Jequex Store',
    description: 'Modern, scalable e-commerce platform built with Next.js',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Jequex Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jequex Store',
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
      <body className={`${lato.variable} font-sans`}>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <main className="flex-1">{children}</main>
          </div>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </Providers>
      </body>
    </html>
  );
}