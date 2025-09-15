import Link from 'next/link';
import { useLanguage } from './LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer-content">
        <Link href="/privacy">{t('privacy')}</Link>
        <Link href="/disclaimer">{t('disclaimer')}</Link>
      </div>
    </footer>
  );
}
