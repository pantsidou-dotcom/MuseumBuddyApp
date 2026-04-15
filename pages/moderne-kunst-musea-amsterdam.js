import Link from 'next/link';
import SEO from '../components/SEO';
import { getStaticMuseumBySlug } from '../lib/staticMuseums';

const MODERN_ART_MUSEUMS = [
  {
    slug: 'stedelijk-museum-amsterdam',
    why: 'Een van de belangrijkste musea voor moderne en hedendaagse kunst in Nederland, met sterke vaste collectie en wisselende exposities.',
  },
  {
    slug: 'moco-museum-amsterdam',
    why: 'Populair voor toegankelijke moderne kunst en bekende namen uit street art en hedendaagse beeldcultuur.',
  },
  {
    slug: 'nxt-museum-amsterdam',
    why: 'Focus op digitale en immersieve installaties, ideaal voor bezoekers die moderne kunst als ervaring willen meemaken.',
  },
  {
    slug: 'straat-museum-amsterdam',
    why: 'Groot museum voor street art en graffiti met monumentale werken van internationale makers.',
  },
  {
    slug: 'eye-filmmuseum-amsterdam',
    why: 'Interessante overlap tussen film, visuele cultuur en moderne artistieke presentatievormen.',
  },
];

function ModernArtMuseumCard({ slug, why }) {
  const museum = getStaticMuseumBySlug(slug);
  if (!museum) return null;

  return (
    <li className="guide-hub-item">
      <Link href={`/museum/${museum.slug}`} className="guide-hub-item__link" aria-label={`Bekijk ${museum.naam}`}>
        <h3 className="guide-hub-item__title">{museum.naam}</h3>
        <p className="guide-hub-item__description">
          {museum.samenvatting} {why}
        </p>
        <span className="guide-hub-item__button" aria-hidden="true">
          bekijk museum <span aria-hidden="true">→</span>
        </span>
      </Link>
    </li>
  );
}

export default function ModernArtMuseumsAmsterdamPage() {
  const title = 'Moderne kunst musea in Amsterdam | Praktische gids';
  const description =
    'Ontdek musea met moderne kunst in Amsterdam. Vergelijk Stedelijk, Moco, Nxt, STRAAT en Eye Filmmuseum en klik door naar detailpagina’s.';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Moderne kunst musea in Amsterdam',
    description,
    url: 'https://museumbuddy.nl/moderne-kunst-musea-amsterdam',
  };

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical="/moderne-kunst-musea-amsterdam"
        robots="index,follow"
        structuredData={structuredData}
      />

      <section className="page-intro">
        <h1 className="page-title">Moderne kunst musea in Amsterdam</h1>
        <p className="page-subtitle">
          Zoek je musea met moderne kunst in Amsterdam? Hieronder vind je een praktische selectie met verschillende
          stijlen: van klassiek moderne kunst tot digitale installaties en street art.
        </p>
      </section>

      <section className="museum-guide-section">
        <h2>Aanraders voor moderne kunst</h2>
        <p className="museum-guide-section-intro">
          Klik door naar de detailpagina per museum om openingstijden, context en praktische informatie te bekijken.
        </p>
        <ul className="guide-hub-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {MODERN_ART_MUSEUMS.map((museum) => (
            <ModernArtMuseumCard key={museum.slug} slug={museum.slug} why={museum.why} />
          ))}
        </ul>
      </section>

      <section className="museum-guide-section">
        <h2>Verder vergelijken</h2>
        <div className="museum-guide-actions">
          <Link href="/beste-musea-amsterdam" className="ticket-button museum-guide-action-link">
            Beste Musea in Amsterdam <span aria-hidden="true">→</span>
          </Link>
          <Link href="/eye-filmmuseum-amsterdam" className="ticket-button museum-guide-action-link">
            Eye Filmmuseum praktische gids <span aria-hidden="true">→</span>
          </Link>
          <Link href="/museumgidsen-amsterdam" className="ticket-button museum-guide-action-link">
            Alle museumgidsen <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
