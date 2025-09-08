import Image from 'next/image';
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <>
      <header className="header">
        <nav className="navbar container">
          <Link href="/" className="brand">
            <Image
              src="/logo.svg"
              alt="Museum Buddy"
              width={200}
              height={200}
              className="brand-logo"
              priority
            />
          </Link>
          <div className="navspacer" />
          {/* Eventuele navigatie-items voor later */}
        </nav>
      </header>
      <main className="container">{children}</main>
    </>
  );
}
