import Link from 'next/link';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useFavorites } from './FavoritesContext';
import { useLanguage } from './LanguageContext';
import Footer from './Footer';
import { FILTERS_SHEET_ID } from './FiltersSheet';
import Button from './ui/Button';
import { NavBar, NavButton, NavLink, NavSection } from './ui/Navigation';

const FILTERS_EVENT = 'museumBuddy:openFilters';

export default function Layout({ children }) {
  const { favorites } = useFavorites();
  const { lang, switchLang, t } = useLanguage();
  const router = useRouter();

  const navLabel = lang === 'en' ? 'Main navigation' : 'Hoofdnavigatie';

  const handleFiltersClick = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FILTERS_EVENT));
    }
  };

  const favoritesCount = favorites.length;
  const favoritesActive = router.pathname.startsWith('/favorites');
  const aboutActive = router.pathname === '/about';

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header className="ds-app-header">
        <div className="container">
          <NavBar aria-label={navLabel}>
            <Link href="/" className="ds-brand ds-nav__brand" aria-label={t('homeLabel')}>
              <span className="ds-brand__lockup" aria-hidden="true">
                <span className="ds-brand__line">Museum</span>
                <span className="ds-brand__line">Buddy</span>
              </span>
            </Link>
            <NavSection className="ds-nav__section--primary">
              <NavLink href="/about" active={aboutActive}>
                {t('aboutLabel')}
              </NavLink>
            </NavSection>
            <NavSection className="ds-nav__section--actions">
              <NavButton
                onClick={handleFiltersClick}
                aria-label={t('filtersButton')}
                aria-controls={FILTERS_SHEET_ID}
                aria-haspopup="dialog"
                className="ds-nav__link--filters"
              >
                {t('filtersButton')}
              </NavButton>
              <NavLink
                href="/favorites"
                active={favoritesActive}
                aria-label={
                  favoritesCount > 0
                    ? `${t('favoritesLabel')} (${favoritesCount})`
                    : t('favoritesLabel')
                }
                badge={favoritesCount > 0 ? favoritesCount : null}
                icon={
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
                }
              >
                {t('favoritesLabel')}
              </NavLink>
              <Button
                variant="ghost"
                tone="brand"
                size="sm"
                className="ds-lang-toggle"
                onClick={() => switchLang(lang === 'en' ? 'nl' : 'en')}
                aria-label={lang === 'en' ? 'Switch to Dutch' : 'Wissel naar Engels'}
                iconPosition="right"
                icon={
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
                }
              >
                {lang === 'en' ? 'EN' : 'NL'}
              </Button>
            </NavSection>
          </NavBar>
        </div>
      </header>
      <main className="container">{children}</main>
      <Footer />
    </>
  );
}
