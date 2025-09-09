import Link from 'next/link';
import Head from 'next/head';
import { useFavorites } from './FavoritesContext';

export default function Layout({ children }) {
  const { favorites } = useFavorites();
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <header className="header">
        <nav className="navbar container">
          <div className="brand-wrap">
            <Link href="/" className="brand-square" aria-label="MuseumBuddy Home">
              <span className="brand-text">MUSEUM<br />BUDDY</span>
            </Link>
            <span className="brand-title">MuseumBuddy</span>
          </div>
          <div className="navspacer" />
          <div className="header-actions">
            <button type="button" className="lang-select">
              EN
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
            <button type="button" className="contrast-toggle">
              Contrast
            </button>
            <Link href="/about" className="header-icon" aria-label="About MuseumBuddy">
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
            </Link>
            <Link href="/favorites" className="header-icon" aria-label="Favorieten">
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
