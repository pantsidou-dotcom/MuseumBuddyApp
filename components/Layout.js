import Link from 'next/link';
import Head from 'next/head';
import { useFavorites } from './FavoritesContext';
import { useLanguage } from './LanguageContext';
import { useTheme } from './ThemeContext';

export default function Layout({ children }) {
  const { favorites } = useFavorites();
  const { lang, switchLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header className="header">
        <nav className="navbar container">
          <div className="brand-wrap">
            <Link href="/" className="brand-square" aria-label={t('homeLabel')}>
              <span className="brand-text">MUSEUM<br />BUDDY</span>
            </Link>
            <span className="brand-title">MuseumBuddy</span>
          </div>
          <div className="navspacer" />
          <div className="header-actions">
            <button
              type="button"
              className="lang-select"
              onClick={() => switchLang(lang === 'en' ? 'nl' : 'en')}
            >
              {lang === 'en' ? 'EN' : 'NL'}
              <svg viewBox="0 0 12 8" aria-hidden="true">
                <path
                  d="M1 1l5 5 5-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              className="contrast-toggle"
              onClick={toggleTheme}
              aria-label={t('contrast')}
            >
              {theme === 'dark' ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <details className="header-menu">
              <summary className="header-icon" aria-label={t('aboutLabel')}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M7 7h10M7 11h10M7 15h10" />
                </svg>
              </summary>
              <div className="header-dropdown">
                <Link href="/about">{t('aboutLabel')}</Link>
                <Link href="/disclaimer">{t('disclaimerLabel')}</Link>
              </div>
            </details>
            <Link href="/favorites" className="header-icon" aria-label={t('favoritesLabel')}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
              </svg>
              {favorites.length > 0 && (
                <span className="favorite-count">{favorites.length}</span>
              )}
            </Link>
          </div>
        </nav>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
