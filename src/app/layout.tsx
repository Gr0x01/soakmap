import type { Metadata } from 'next';
import { Bricolage_Grotesque, Newsreader } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  variable: '--font-bricolage',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

const newsreader = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'SoakMap - Find Hot Springs & Swimming Holes',
    template: '%s | SoakMap',
  },
  description:
    'Discover natural hot springs and swimming holes across America. Filter by temperature, experience type, and location to find your perfect soak.',
  keywords: [
    'hot springs',
    'swimming holes',
    'natural springs',
    'soaking',
    'primitive hot springs',
    'resort hot springs',
  ],
  authors: [{ name: 'SoakMap' }],
  creator: 'SoakMap',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'SoakMap',
    title: 'SoakMap - Find Hot Springs & Swimming Holes',
    description:
      'Discover natural hot springs and swimming holes across America.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SoakMap - Find Hot Springs & Swimming Holes',
    description:
      'Discover natural hot springs and swimming holes across America.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bricolage.variable} ${newsreader.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
