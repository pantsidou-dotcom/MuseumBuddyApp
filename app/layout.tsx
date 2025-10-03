import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://museum-buddy.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'MuseumBuddy',
    template: '%s | MuseumBuddy',
  },
  description:
    'Vind de beste musea en tentoonstellingen in Nederland. MuseumBuddy helpt je de perfecte culturele dag uit te plannen.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'MuseumBuddy',
    description:
      'Ontdek musea en tentoonstellingen in Nederland met slimme filters, actuele highlights en handige tips.',
    url: siteUrl,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MuseumBuddy',
    description:
      'Ontdek musea en tentoonstellingen in Nederland met slimme filters, actuele highlights en handige tips.',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <body className="min-h-screen bg-slate-50 font-sans">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </body>
    </html>
  );
}
