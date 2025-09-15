import Link from 'next/link';
import { useLanguage } from './LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer-content">
        <Link href="/privacy">{t('privacyLabel')}</Link>
        <Link href="/disclaimer">{t('disclaimer')}</Link>
      </div>
      <div className="container footer-disclaimer">
        {t('affiliateDisclaimer')}
      </div>
    </footer>
  );
}
