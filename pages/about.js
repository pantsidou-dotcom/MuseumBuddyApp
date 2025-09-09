import Head from 'next/head';
import { useLanguage } from '../components/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <>
      <Head>
        <title>{t('aboutTitle')}</title>
      </Head>
      <h1 className="page-title">{t('aboutTitle')}</h1>
      <p>{t('aboutBody')}</p>
    </>
  );
}
