import Head from 'next/head';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';
import { ThemeProvider } from '../components/ThemeContext';

const fontStylesheetHref =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&display=swap';

export default function MyApp({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <FavoritesProvider>
        <ThemeProvider>
          <Head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="preload" as="style" href={fontStylesheetHref} />
            <link rel="stylesheet" href={fontStylesheetHref} />
            <noscript>
              <link rel="stylesheet" href={fontStylesheetHref} />
            </noscript>
          </Head>
          <Layout>
            <Component {...pageProps} />
          </Layout>
        </ThemeProvider>
      </FavoritesProvider>
    </LanguageProvider>
  );
}
