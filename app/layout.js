import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';

export const metadata = {
  title: 'MuseumBuddy | Ontdek musea in Amsterdam',
  description:
    'Plan je museumbezoek met actuele openingstijden, tentoonstellingen en favorieten in één overzicht.',
  openGraph: {
    title: 'MuseumBuddy | Ontdek musea in Amsterdam',
    description:
      'Plan je museumbezoek met actuele openingstijden, tentoonstellingen en favorieten in één overzicht.',
    type: 'website',
    url: 'https://museumbuddy.nl/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MuseumBuddy | Ontdek musea in Amsterdam',
    description:
      'Plan je museumbezoek met actuele openingstijden, tentoonstellingen en favorieten in één overzicht.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl">
      <body>
        <LanguageProvider>
          <FavoritesProvider>
            <Layout>{children}</Layout>
          </FavoritesProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
