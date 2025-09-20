import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from './LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-brand">
          <Link href="/" className="brand-logo footer-logo" aria-label={t('homeLabel')}>
            <Image
              src="/logo.svg"
              alt="Museum Buddy"
              width={180}
              height={52}
              className="brand-logo-image"
            />
          </Link>
          <div className="footer-claim">
            <span className="footer-title">Museum Buddy</span>
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
