import '../styles/globals.css';
import Layout from '../components/Layout';
import { FavoritesProvider } from '../components/FavoritesContext';

export default function MyApp({ Component, pageProps }) {
  return (
    <FavoritesProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </FavoritesProvider>
  );
}
