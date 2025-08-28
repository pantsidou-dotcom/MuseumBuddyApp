import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <>
      <header className="header">
        <nav className="navbar container">
          <Link href="/" className="brand">MuseumBuddy</Link>
          <div className="navspacer" />
          {/* Eventuele navigatie-items voor later */}
          <Link href="/" className="navlink">Musea</Link>
          <a href="https://museum.nl" target="_blank" rel="noreferrer" className="navlink">museum.nl</a>
        </nav>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
