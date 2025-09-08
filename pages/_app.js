import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Header from '../components/Header';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <Component {...pageProps} />
    </>
  );
}
import '../styles/globals.css';
import Layout from '../components/Layout';
export default function MyApp({ Component, pageProps }) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}
