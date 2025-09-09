import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <LanguageProvider>
      <FavoritesProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </FavoritesProvider>
    </LanguageProvider>
  );
}
