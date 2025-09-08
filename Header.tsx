import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="flex items-center gap-3 p-3">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/brand/museum_buddy_logo.png"
          alt="MuseumBuddy"
          width={36}
          height={36}
          priority
        />
        <span className="font-semibold">MuseumBuddy</span>
      </Link>
    </header>
  );
}
