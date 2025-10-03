import Head from 'next/head';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';

const fontStylesheetHref =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
const tailwindCdnHref = 'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.10/dist/tailwind.min.css';

export default function MyApp({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <FavoritesProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="preload" as="style" href={fontStylesheetHref} />
          <link rel="stylesheet" href={fontStylesheetHref} />
          <link rel="stylesheet" href={tailwindCdnHref} />
          <noscript>
            <link rel="stylesheet" href={fontStylesheetHref} />
            <link rel="stylesheet" href={tailwindCdnHref} />
          </noscript>
        </Head>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </FavoritesProvider>
    </LanguageProvider>
  );
}
