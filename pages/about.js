import SEO from '../components/SEO';
import { useLanguage } from '../components/LanguageContext';

export default function AboutPage() {
  const { t } = useLanguage();
  return (
    <>
      <SEO title={t('aboutTitle')} />
      <h1 className="page-title">{t('aboutTitle')}</h1>
      <p>{t('aboutBody')}</p>
    </>
  );
}
