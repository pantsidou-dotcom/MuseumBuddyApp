import { useEffect } from 'react';
import { Inter, Manrope } from 'next/font/google';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';
import { ThemeProvider } from '../components/ThemeContext';

const titleFont = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-title',
});

const bodyFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-body',
});

const fontClassList = [
  titleFont.variable,
  titleFont.className,
  bodyFont.variable,
  bodyFont.className,
].filter(Boolean);

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    document.body.classList.add(...fontClassList);

    return () => {
      document.body.classList.remove(...fontClassList);
    };
  }, []);

  return (
    <LanguageProvider>
      <FavoritesProvider>
        <ThemeProvider>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </FavoritesProvider>
    </LanguageProvider>
  );
}
