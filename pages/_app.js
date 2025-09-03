import '../styles/globals.css';
import Layout from '../components/Layout';
import { Quicksand } from 'next/font/google';

// Load Quicksand and expose it as a CSS variable so it can be used globally
const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default function MyApp({ Component, pageProps }) {
  return (
    <div className={quicksand.variable}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </div>
  );
}
