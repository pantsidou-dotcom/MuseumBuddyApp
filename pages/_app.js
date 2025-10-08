import Head from 'next/head';
import Script from 'next/script';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';

const fontStylesheetHref =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
const tailwindCdnHref = 'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.10/dist/tailwind.min.css';

export default function MyApp({ Component, pageProps }) {
  const plausibleDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  const plausibleSrc = process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js';
  const plausibleApiHost = process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST;

  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiSrc = process.env.NEXT_PUBLIC_UMAMI_SRC;
  const umamiDataHost = process.env.NEXT_PUBLIC_UMAMI_DATA_HOST;

  const plausibleProps = {};
  if (plausibleApiHost) {
    plausibleProps['data-api'] = plausibleApiHost;
  }

  const umamiProps = {};
  if (umamiDataHost) {
    umamiProps['data-host-url'] = umamiDataHost;
  }

  return (
    <LanguageProvider>
      <FavoritesProvider>
        <Head>
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
        {plausibleDomain ? (
          <Script
            strategy="afterInteractive"
            data-domain={plausibleDomain}
            src={plausibleSrc}
            {...plausibleProps}
          />
        ) : null}
        {umamiWebsiteId && umamiSrc ? (
          <Script
            strategy="afterInteractive"
            src={umamiSrc}
            data-website-id={umamiWebsiteId}
            {...umamiProps}
          />
        ) : null}
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </FavoritesProvider>
    </LanguageProvider>
  );
}
