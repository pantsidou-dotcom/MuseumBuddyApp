import '../styles/globals.css';
import Layout from '../components/Layout';
import { Playfair_Display, Roboto } from 'next/font/google';

const headingFont = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['400', '700'],
  display: 'swap',
});

const bodyFont = Roboto({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
  display: 'swap',
});

export default function MyApp({ Component, pageProps }) {
  return (
    <div className={`${headingFont.variable} ${bodyFont.variable}`}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </div>
  );
}
