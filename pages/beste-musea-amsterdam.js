import Image from 'next/image';
import Link from 'next/link';
import SEO from '../components/SEO';
import museumImages from '../lib/museumImages';
import { getStaticMuseumBySlug } from '../lib/staticMuseums';

const FEATURED_SLUGS = [
  'rijksmuseum-amsterdam',
  'van-gogh-museum-amsterdam',
  'anne-frank-huis-amsterdam',
];

const HIDDEN_GEM_SLUGS = [
  'micropia-museum-amsterdam',
  'het-schip-amsterdam',
  'huis-marseille-amsterdam',
  'nxt-museum-amsterdam',
  'woonbootmuseum-amsterdam',
];

const GROUPS = [
  {
    title: 'Voor kunstliefhebbers',
    museums: ['rijksmuseum-amsterdam', 'van-gogh-museum-amsterdam', 'stedelijk-museum-amsterdam'],
  },
  {
    title: 'Voor geschiedenis en erfgoed',
    museums: ['anne-frank-huis-amsterdam', 'amsterdam-museum-amsterdam', 'ons-lieve-heer-op-solder-amsterdam'],
  },
  {
    title: 'Voor moderne kunst en digitale beleving',
    museums: ['stedelijk-museum-amsterdam', 'moco-museum-amsterdam', 'nxt-museum-amsterdam'],
  },
  {
    title: 'Voor fotografie',
    museums: ['foam-fotografiemuseum-amsterdam', 'huis-marseille-amsterdam'],
  },
];

const QUICK_CHOICES = [
  {
    title: 'Met kinderen',
    description: 'Musea die vaak goed werken voor gezinnen met kinderen.',
    href: '/kindvriendelijke-musea-amsterdam',
  },
  {
    title: 'Populaire musea',
    description: 'Start met de bekendste keuzes voor een eerste bezoek.',
    href: '#populaire-musea',
  },
  {
    title: 'Moderne kunst',
    description: 'Voor hedendaagse kunst, design en digitale installaties.',
    href: '/moderne-kunst-musea-amsterdam',
  },
  {
    title: 'Regenachtige dag',
    description: 'Binnenopties voor een ontspannen museumdag in de stad.',
    href: '/museumgidsen-amsterdam',
  },
  {
    title: 'Kort bezoek (1–2 uur)',
    description: 'Snelle keuzes als je beperkte tijd hebt in Amsterdam.',
    href: '#tips-kiezen',
  },
];

function getMuseum(slug) {
  return getStaticMuseumBySlug(slug);
}

function getSingleSentence(text) {
  if (!text) return 'Een interessante keuze voor een museumbezoek in Amsterdam.';
  const trimmed = text.trim();
  const firstSentenceMatch = trimmed.match(/^[^.!?]+[.!?]/);
  return firstSentenceMatch ? firstSentenceMatch[0] : trimmed;
}

function MuseumInlineLinks({ slugs }) {
  const museums = slugs.map(getMuseum).filter(Boolean);

  return museums.map((museum, index) => {
    const isLast = index === museums.length - 1;
    const isSecondLast = index === museums.length - 2;

    return (
      <span key={museum.slug}>
        <Link href={`/museum/${museum.slug}`}>{museum.naam}</Link>
        {!isLast ? (isSecondLast ? ' en ' : ', ') : ''}
      </span>
    );
  });
}

function QuickChoiceCard({ title, description, href }) {
  return (
    <Link className="quick-choice-card" href={href}>
      <h3>{title}</h3>
      <p>{description}</p>
      <span>Bekijk selectie</span>
    </Link>
  );
}

function MuseumSelectionCard({ slug }) {
  const museum = getMuseum(slug);
  if (!museum) return null;

  const image = museumImages[slug] || '/images/og-home.svg';
  const summary = getSingleSentence(museum.samenvatting);

  return (
    <article className="museum-selection-card">
      <div className="museum-selection-card__image-wrapper">
        <Image src={image} alt={museum.naam} className="museum-selection-card__image" sizes="(max-width: 800px) 100vw, 360px" />
      </div>

      <div className="museum-selection-card__content">
        <h3>{museum.naam}</h3>
        <p>{summary}</p>

        <div className="museum-selection-card__actions">
          <Link className="museum-selection-card__primary" href={`/museum/${museum.slug}`}>
            Bekijk museum
          </Link>

          {museum.ticket_affiliate_url ? (
            <a
              className="museum-selection-card__secondary"
              href={museum.ticket_affiliate_url}
              target="_blank"
              rel="noreferrer sponsored"
            >
              Tickets bekijken
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function BestMuseumsAmsterdamPage() {
  const title = 'Beste musea in Amsterdam | MuseumBuddy';
  const description =
    'Discover the best museums in Amsterdam. From famous highlights like the Rijksmuseum to hidden gems. Find the perfect museum for your visit.';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Beste musea in Amsterdam',
    description,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [...FEATURED_SLUGS, ...HIDDEN_GEM_SLUGS].map((slug, index) => {
        const museum = getMuseum(slug);
        return {
          '@type': 'ListItem',
          position: index + 1,
          name: museum?.naam || slug,
          url: `https://museumbuddy.nl/museum/${slug}`,
        };
      }),
    },
  };

  return (
    <>
      <SEO
        title={title}
        description={description}
        robots="index,follow"
        canonical="/beste-musea-amsterdam"
        image="/images/og-home.svg"
        structuredData={structuredData}
      />

      <section className="page-intro">
        <h1 className="page-title">Beste musea in Amsterdam</h1>
        <p className="page-subtitle">
          Amsterdam heeft een uitzonderlijk museumaanbod: van wereldberoemde kunstcollecties tot kleinere musea met
          een heel eigen invalshoek. Juist die mix maakt de stad interessant voor verschillende soorten bezoekers.
          Misschien wil je topstukken uit de kunstgeschiedenis zien, misschien zoek je een plek die dieper ingaat op
          de geschiedenis van de stad, of juist een museum rond fotografie, digitale kunst of wetenschap. Op deze
          pagina vind je daarom een redactioneel samengestelde selectie van musea die wij vaak aanraden voor een bezoek
          aan Amsterdam.
        </p>
        <p className="page-subtitle">
          Dit is bewust geen complete lijst van alle musea in de stad. Zie het als een praktische gids om sneller te
          kiezen op basis van je interesse en je beschikbare tijd. Elk genoemd museum linkt direct naar de bijbehorende
          MuseumBuddy-detailpagina, zodat je makkelijk kunt doorklikken voor meer context en je bezoek beter kunt
          plannen.
        </p>
      </section>

      <section className="content-section" aria-labelledby="snelle-keuzes-title">
        <h2 id="snelle-keuzes-title">Snelle keuzes</h2>
        <p className="section-intro">Kies hieronder direct een richting en ga door naar de selectie die bij je bezoek past.</p>
        <div className="quick-choice-grid">
          {QUICK_CHOICES.map((choice) => (
            <QuickChoiceCard key={choice.title} {...choice} />
          ))}
        </div>
      </section>

      <section className="content-section" aria-labelledby="populaire-musea">
        <h2 id="populaire-musea">De bekendste musea in Amsterdam</h2>
        <p className="section-intro">Deze musea zijn vaak een logische eerste keuze als je voor het eerst in Amsterdam bent.</p>
        <div className="museum-selection-grid">
          {FEATURED_SLUGS.map((slug) => (
            <MuseumSelectionCard key={slug} slug={slug} />
          ))}
        </div>
      </section>

      <section className="content-section" aria-labelledby="bijzondere-musea">
        <h2 id="bijzondere-musea">Minder bekende, maar bijzondere musea</h2>
        <p className="section-intro">Voor wie iets anders zoekt dan de bekendste highlights, met compacte en onderscheidende keuzes.</p>
        <div className="museum-selection-grid">
          {HIDDEN_GEM_SLUGS.map((slug) => (
            <MuseumSelectionCard key={slug} slug={slug} />
          ))}
        </div>
      </section>

      <section className="content-section" style={{ marginBottom: '2rem' }}>
        <h2>Welk museum past bij jou?</h2>
        <ul>
          {GROUPS.map((group) => (
            <li key={group.title}>
              <strong>{group.title}:</strong> <MuseumInlineLinks slugs={group.museums} />.
            </li>
          ))}
        </ul>
      </section>

      <section id="tips-kiezen" className="content-section" style={{ marginBottom: '2rem' }}>
        <h2>Tips voor het kiezen van een museum</h2>
        <ul>
          <li>
            <strong>Ga vroeg of later op de dag:</strong> populaire musea zijn vaak het drukst in het midden van de
            dag. Buiten piekuren heb je meestal meer rust.
          </li>
          <li>
            <strong>Boek tickets vooraf:</strong> bij bekende locaties kan een tijdslot nodig zijn. Vooraf boeken maakt
            je planning betrouwbaarder.
          </li>
          <li>
            <strong>Combineer slim:</strong> kies bijvoorbeeld één groot museum en één kleiner museum op dezelfde dag,
            zodat je tempo prettig blijft.
          </li>
          <li>
            <strong>Reken op de juiste duur:</strong> trek voor grote musea vaak meerdere uren uit en voor compacte,
            nichemusea meestal 60–90 minuten.
          </li>
        </ul>
      </section>

      <section className="content-section" style={{ marginBottom: '2rem' }}>
        <h2>Meer musea ontdekken in Amsterdam</h2>
        <p>
          Wil je verder vergelijken? Bekijk alle actuele <Link href="/tentoonstellingen">tentoonstellingen</Link>, ga
          terug naar de <Link href="/">homepage</Link> of lees direct meer over{' '}
          <Link href="/museum/rijksmuseum-amsterdam">Rijksmuseum</Link>,{' '}
          <Link href="/museum/stedelijk-museum-amsterdam">Stedelijk Museum Amsterdam</Link>,{' '}
          <Link href="/museum/foam-fotografiemuseum-amsterdam">FOAM Fotografiemuseum</Link> en{' '}
          <Link href="/museum/micropia-museum-amsterdam">Micropia</Link>.
        </p>
      </section>

      <style jsx>{`
        .content-section {
          margin: 0 0 2.5rem;
        }

        .section-intro {
          margin: 0.6rem 0 1rem;
          max-width: 70ch;
          color: #374151;
        }

        .quick-choice-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 0.9rem;
        }

        .quick-choice-card {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 1rem;
          text-decoration: none;
          color: inherit;
          background: #fff;
          transition: border-color 0.15s ease;
        }

        .quick-choice-card:hover,
        .quick-choice-card:focus-visible {
          border-color: #9ca3af;
        }

        .quick-choice-card h3 {
          margin: 0;
          font-size: 1rem;
        }

        .quick-choice-card p {
          margin: 0;
          color: #4b5563;
          font-size: 0.95rem;
          line-height: 1.45;
        }

        .quick-choice-card span {
          margin-top: auto;
          color: #111827;
          font-weight: 600;
          font-size: 0.92rem;
        }

        .museum-selection-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1rem;
        }

        .museum-selection-card {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
        }

        .museum-selection-card__image-wrapper {
          position: relative;
          width: 100%;
          aspect-ratio: 4 / 3;
          background: #f3f4f6;
        }

        .museum-selection-card__image {
          object-fit: cover;
        }

        .museum-selection-card__content {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          padding: 1rem;
        }

        .museum-selection-card__content h3 {
          margin: 0;
          font-size: 1.05rem;
          color: #111827;
        }

        .museum-selection-card__content p {
          margin: 0;
          color: #374151;
          line-height: 1.45;
          min-height: 3em;
        }

        .museum-selection-card__actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.55rem 0.85rem;
          margin-top: 0.2rem;
        }

        .museum-selection-card__primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.48rem 0.75rem;
          border-radius: 8px;
          background: #111827;
          color: #fff;
          text-decoration: none;
          font-weight: 600;
          font-size: 0.92rem;
        }

        .museum-selection-card__primary:hover,
        .museum-selection-card__primary:focus-visible {
          background: #1f2937;
        }

        .museum-selection-card__secondary {
          color: #4b5563;
          font-size: 0.9rem;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      `}</style>
    </>
  );
}
