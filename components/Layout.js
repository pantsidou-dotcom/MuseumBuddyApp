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
        </nav>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
