import Link from 'next/link';
import SEO from '../components/SEO';

const guidePages = [
  {
    href: '/ons-lieve-heer-op-solder-tickets',
    title: "Ons' Lieve Heer op Solder tickets",
    description: 'Praktische informatie, openingstijden en ticketbeschikbaarheid voor een rustig bezoek.',
  },
  {
    href: '/beste-musea-amsterdam',
    title: 'Beste musea in Amsterdam',
    description: 'Onze redactionele selectie met musea die vaak als eerste keuze worden bekeken.',
  },
  {
    href: '/kindvriendelijke-musea-amsterdam',
    title: 'Kindvriendelijke musea in Amsterdam',
    description: 'Snel overzicht voor gezinnen, inclusief praktische context per museumkeuze.',
  },
  {
    href: '/gratis-musea-amsterdam',
    title: 'Gratis musea in Amsterdam',
    description: 'Een toegankelijke gids met gratis opties en tips voor je planning.',
  },
];

export default function MuseumGuidesAmsterdamPage() {
  return (
    <>
      <SEO
        title="Museumgidsen Amsterdam | Tickets, tips en praktische info"
        description="Alle MuseumBuddy gidsen op één plek: tickets, openingstijden, praktische informatie en selecties voor musea in Amsterdam."
        canonical="/museumgidsen-amsterdam"
      />

      <section className="page-intro">
        <h1 className="page-title">Museumgidsen Amsterdam: tickets, tips en praktische info</h1>
        <p className="page-subtitle">
          Op deze pagina vind je onze gidsen en informatieve pagina&apos;s op één plek. Handig als je snel wilt kiezen
          welk museum bij je past en direct praktische info wilt bekijken.
        </p>
      </section>

      <ul className="guide-hub-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {guidePages.map((guide) => (
          <li key={guide.href} className="guide-hub-item">
            <h2>
              <Link href={guide.href}>{guide.title}</Link>
            </h2>
            <p>{guide.description}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
