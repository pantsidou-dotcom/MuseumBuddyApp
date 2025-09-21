import { Inter, Manrope } from 'next/font/google';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';
import { ThemeProvider } from '../components/ThemeContext';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
  preload: true,
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-title',
  preload: true,
});

export default function MyApp({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <FavoritesProvider>
        <ThemeProvider>
          <div className={`${inter.variable} ${manrope.variable}`}>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </div>
        </ThemeProvider>
      </FavoritesProvider>
    </LanguageProvider>
  );
}
