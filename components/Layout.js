import Link from 'next/link';
import Head from 'next/head';
import { useFavorites } from './FavoritesContext';
import { useLanguage } from './LanguageContext';
import Footer from './Footer';
import { FILTERS_SHEET_ID } from './FiltersSheet';

const FILTERS_EVENT = 'museumBuddy:openFilters';

export default function Layout({ children }) {
  const { favorites } = useFavorites();
  const { lang, switchLang, t } = useLanguage();

  const navLabel = lang === 'en' ? 'Main navigation' : 'Hoofdnavigatie';

  const handleFiltersClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FILTERS_EVENT));
    }
  };
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header className="header">
        <nav className="navbar container" aria-label={navLabel}>
          <Link href="/" className="header-brand" aria-label={t('homeLabel')}>
            <span className="brand-lockup">
              <span className="brand-title-line">Museum</span>
              <span className="brand-title-line">Buddy</span>
            </span>
          </Link>
          <div className="header-links">
            <Link href="/about" className="header-link">
              {t('aboutLabel')}
            </Link>
            <Link href="/tentoonstellingen" className="header-link">
              {t('exhibitions')}
            </Link>
            <button
              type="button"
              className="header-link header-link--filters"
              onClick={handleFiltersClick}
              aria-label={t('filtersButton')}
              aria-controls={FILTERS_SHEET_ID}
              aria-haspopup="dialog"
            >
              {t('filtersButton')}
            </button>
            <Link
              href="/favorites"
              className="header-link header-link--favorites"
              aria-label={
                favorites.length > 0
                  ? `${t('favoritesLabel')} (${favorites.length})`
                  : t('favoritesLabel')
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
              </svg>
              <span>{t('favoritesLabel')}</span>
              {favorites.length > 0 && (
                <span className="favorite-count" aria-live="polite">
                  {favorites.length}
                </span>
              )}
            </Link>
          </div>
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
          </div>
        </nav>
      </header>
      <main className="container">{children}</main>
      <Footer />
    </>
  );
}
