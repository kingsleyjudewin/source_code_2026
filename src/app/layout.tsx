import type { Metadata, Viewport } from 'next';
import { Orbitron, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { FEST } from '@/data/events';
import { SITE_URL } from '@/lib/site';

/* Self-hosted at build time by next/font — no render-blocking request to Google. */
const orbitron = Orbitron({
  subsets: ['latin'],
  weight: ['400', '700', '800', '900'],
  variable: '--font-orbitron',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

const DESCRIPTION =
  'Source Code 2026 — the annual technical fest of the Department of Electronics & Communication Engineering, CHRIST University, presented by CUESTIC. Five events. Five universes. Innovate. Compete. Conquer.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${FEST.name} — ${FEST.university}`,
    template: `%s · ${FEST.name}`,
  },
  description: DESCRIPTION,
  applicationName: FEST.name,
  keywords: [
    'Source Code 2026',
    'CHRIST University',
    'CUESTIC',
    'Electronics and Communication Engineering',
    'technical fest',
    'The Gauntlet',
    'Stark Forge',
    'Brainverse',
    'Daily Bugle',
    'Brand New Circuit',
  ],
  authors: [{ name: FEST.association }],
  openGraph: {
    type: 'website',
    title: `${FEST.name} — ${FEST.university}`,
    description: DESCRIPTION,
    siteName: FEST.name,
    images: [
      {
        url: '/posters/generated/the-gauntlet/1600.webp',
        width: 1600,
        height: 893,
        alt: 'Source Code 2026 — The Gauntlet',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${FEST.name} — ${FEST.university}`,
    description: DESCRIPTION,
    images: ['/posters/generated/the-gauntlet/1600.webp'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#050816',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: FEST.name,
  description: DESCRIPTION,
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  organizer: {
    '@type': 'CollegeOrUniversity',
    name: FEST.university,
    department: { '@type': 'Organization', name: FEST.department },
  },
  location: {
    '@type': 'Place',
    name: FEST.university,
    address: { '@type': 'PostalAddress', addressLocality: 'Bangalore', addressCountry: 'IN' },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${inter.variable} ${mono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          // Static, author-controlled object — no user input reaches this string.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
