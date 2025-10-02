import { useEffect } from 'react';
import Head from 'next/head';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';

const fontStylesheetHref =
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
const tailwindCdnHref = 'https://cdn.jsdelivr.net/npm/tailwindcss@3.4.10/dist/tailwind.min.css';

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const keywords = ["opgeslagen scenario's", 'saved scenarios'];
    const labels = new Set(['laden', 'load']);

    const hideLoadButtons = () => {
      const allButtons = Array.from(document.querySelectorAll('button'));
      allButtons.forEach((button) => {
        if (!button.isConnected) return;
        const text = button.textContent?.trim().toLowerCase();
        if (!text || !labels.has(text)) return;

        let container = button.parentElement;
        let shouldRemove = false;

        while (container && container !== document.body) {
          if (container.textContent) {
            const content = container.textContent.toLowerCase();
            if (keywords.some((keyword) => content.includes(keyword))) {
              shouldRemove = true;
              break;
            }
          }
          container = container.parentElement;
        }

        if (shouldRemove) {
          button.remove();
        }
      });
    };

    hideLoadButtons();

    const observer = new MutationObserver(() => hideLoadButtons());
    if (document.body) {
      observer.observe(document.body, { subtree: true, childList: true });
    }

    return () => observer.disconnect();
  }, []);

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
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </FavoritesProvider>
    </LanguageProvider>
  );
}
