import Link from 'next/link';
import { useLanguage } from './LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link href="/" className="brand-square footer-logo" aria-label={t('homeLabel')}>
            <span className="brand-letter">MB</span>
          </Link>
          <div className="footer-claim">
            <span className="footer-title">MuseumBuddy</span>
            <span className="footer-tagline">{t('heroTagline')}</span>
            <p className="footer-claim-text">{t('heroSubtitle')}</p>
          </div>
        </div>
        <div className="footer-meta">
          <nav className="footer-links" aria-label="Footer">
            <Link href="/privacy">{t('privacy')}</Link>
            <Link href="/disclaimer">{t('disclaimer')}</Link>
          </nav>
          <p className="footer-smallprint">{t('affiliateDisclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
