import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';
import { ThemeProvider } from '../components/ThemeContext';

export default function MyApp({ Component, pageProps }) {
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
