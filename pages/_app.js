import '../styles/globals.css';
import { Inter } from 'next/font/google';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';
import { LanguageProvider } from '../components/LanguageContext';
import { ThemeProvider } from '../components/ThemeContext';

const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout ?? ((page) => <Layout>{page}</Layout>);
  const page = <Component {...pageProps} />;

  return (
    <LanguageProvider>
      <FavoritesProvider>
        <ThemeProvider>
          <div className={inter.className} style={{ minHeight: '100vh', background: '#FAFAFA' }}>
            {getLayout(page)}
          </div>
        </ThemeProvider>
      </FavoritesProvider>
    </LanguageProvider>
  );
}
