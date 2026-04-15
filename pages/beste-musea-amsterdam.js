import Image from 'next/image';
import Link from 'next/link';
import SEO from '../components/SEO';
import museumImages from '../lib/museumImages';
import museumImageCredits from '../lib/museumImageCredits';
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

const QUICK_VISIT_SLUGS = ['micropia-museum-amsterdam', 'huis-marseille-amsterdam', 'woonbootmuseum-amsterdam'];

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
    title: 'Regenachtige dag',
    description: 'Alleen musea die nu open zijn, handig als je direct naar binnen wilt.',
    href: '/?open_now=1',
  },
  {
    title: 'Kort bezoek',
    description: 'Snelle musea van ongeveer 60–90 minuten voor een compact programma.',
    href: '#kort-bezoek',
  },
  {
    title: 'Met kinderen',
    description: 'Bekijk direct kindvriendelijke musea met praktische tips.',
    href: '/kindvriendelijke-musea-amsterdam',
  },
  {
    title: 'Gratis of budgetvriendelijk',
    description: 'Selectie van gratis en laagdrempelige museumopties.',
    href: '/gratis-musea-amsterdam',
  },
];

function getMuseum(slug) {
  return getStaticMuseumBySlug(slug);
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

function getCreditLine(slug) {
  const credit = museumImageCredits[slug];
  if (!credit) return null;

  const parts = [credit.author, credit.source, credit.license].filter(Boolean);
  return parts.length ? `Fotocredit: ${parts.join(' • ')}` : null;
}

function MuseumCardCompact({ slug, compact = false }) {
  const museum = getMuseum(slug);
  if (!museum) return null;

  const image = museumImages[slug];
  const creditLine = getCreditLine(slug);
  const hasTickets = Boolean(museum.ticket_affiliate_url);

  return (
    <article className={`museum-compact-card${compact ? ' museum-compact-card--small' : ''}`}>
      <Link href={`/museum/${museum.slug}`} className="museum-compact-card__image-link" aria-label={`Bekijk ${museum.naam}`}>
        {image ? (
          <Image
            src={image}
            alt={museum.naam}
            className="museum-compact-card__image"
            sizes={compact ? '(max-width: 900px) 100vw, 33vw' : '(max-width: 900px) 100vw, 40vw'}
          />
        ) : (
          <div className="museum-compact-card__image museum-compact-card__image--placeholder" aria-hidden="true" />
        )}
      </Link>

      <div className="museum-compact-card__content">
        <h3>
          <Link href={`/museum/${museum.slug}`}>{museum.naam}</Link>
        </h3>

        <p className="museum-compact-card__summary">{museum.samenvatting}</p>

        {creditLine ? <p className="museum-compact-card__credit">{creditLine}</p> : null}

        <div className="museum-compact-card__actions">
          <Link href={`/museum/${museum.slug}`} className="museum-compact-card__cta">
            Bekijk museum
          </Link>
          {hasTickets ? (
            <a
              href={museum.ticket_affiliate_url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="museum-compact-card__ticket"
            >
              Tickets <span className="museum-compact-card__badge">Partner</span>
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

      <section className="museum-overview-section museum-overview-section--quick" aria-labelledby="snelle-keuzes-heading">
        <h2 id="snelle-keuzes-heading">Snelle keuzes</h2>
        <div className="quick-choice-grid">
          {QUICK_CHOICES.map((choice) => (
            <Link key={choice.title} href={choice.href} className="quick-choice-link">
              <strong>{choice.title}</strong>
              <span>{choice.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="museum-overview-section" aria-labelledby="bekendste-musea-heading">
        <h2 id="bekendste-musea-heading">De bekendste musea in Amsterdam</h2>
        <div className="museum-cards-grid museum-cards-grid--featured">
          {FEATURED_SLUGS.map((slug) => (
            <MuseumCardCompact key={slug} slug={slug} />
          ))}
        </div>
      </section>

      <section className="museum-overview-section" aria-labelledby="bijzondere-musea-heading">
        <h2 id="bijzondere-musea-heading">Minder bekende, maar bijzondere musea</h2>
        <div className="museum-cards-grid museum-cards-grid--hidden">
          {HIDDEN_GEM_SLUGS.map((slug) => (
            <MuseumCardCompact key={slug} slug={slug} compact />
          ))}
        </div>
      </section>

      <section id="kort-bezoek" className="museum-overview-section" aria-labelledby="kort-bezoek-heading">
        <h2 id="kort-bezoek-heading">Kort bezoek (ongeveer 60–90 minuten)</h2>
        <p className="page-subtitle museum-overview-section__subtitle">
          Weinig tijd? Deze musea zijn meestal goed te doen als compacte stop en geven toch een sterke ervaring.
        </p>
        <div className="museum-cards-grid museum-cards-grid--hidden">
          {QUICK_VISIT_SLUGS.map((slug) => (
            <MuseumCardCompact key={slug} slug={slug} compact />
          ))}
        </div>
      </section>

      <section className="museum-overview-section" style={{ marginBottom: '2rem' }}>
        <h2>Welk museum past bij jou?</h2>
        <ul>
          {GROUPS.map((group) => (
            <li key={group.title}>
              <strong>{group.title}:</strong> <MuseumInlineLinks slugs={group.museums} />.
            </li>
          ))}
        </ul>
      </section>

      <section className="museum-overview-section" style={{ marginBottom: '2rem' }}>
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

      <section className="museum-overview-section" style={{ marginBottom: '2rem' }}>
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
        .museum-overview-section {
          margin-bottom: 2.5rem;
        }

        .museum-overview-section h2 {
          margin: 0 0 1rem;
        }

        .museum-overview-section--quick {
          padding: 1rem;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          background: #f8fafc;
        }

        .quick-choice-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }

        .quick-choice-link {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 0.85rem 0.95rem;
          border-radius: 12px;
          border: 1px solid #dbe2ea;
          background: #ffffff;
          color: #111827;
          text-decoration: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
          cursor: pointer;
        }

        .quick-choice-link strong {
          font-size: 0.98rem;
          line-height: 1.2;
        }

        .quick-choice-link span {
          font-size: 0.88rem;
          color: #4b5563;
          line-height: 1.35;
        }

        .quick-choice-link:hover,
        .quick-choice-link:focus-visible {
          border-color: #b8c7d9;
          box-shadow: 0 8px 22px rgba(15, 23, 42, 0.08);
          transform: translateY(-1px);
          outline: none;
        }

        .museum-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
        }

        .museum-cards-grid--hidden {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.85rem;
        }

        :global(.museum-compact-card) {
          display: flex;
          flex-direction: column;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
          min-height: 305px;
        }

        :global(.museum-compact-card--small) {
          min-height: 250px;
        }

        :global(.museum-compact-card__image-link) {
          display: block;
          position: relative;
        }

        :global(.museum-compact-card__image) {
          width: 100%;
          height: 140px;
          object-fit: cover;
          display: block;
        }

        :global(.museum-compact-card--small .museum-compact-card__image) {
          height: 108px;
        }

        :global(.museum-compact-card__image--placeholder) {
          background: linear-gradient(135deg, #dbeafe, #f1f5f9);
        }

        :global(.museum-compact-card__content) {
          display: flex;
          flex: 1;
          flex-direction: column;
          gap: 0.55rem;
          padding: 0.8rem;
        }

        :global(.museum-compact-card__content h3) {
          margin: 0;
          font-size: 1rem;
          line-height: 1.25;
        }

        :global(.museum-compact-card__content h3 a) {
          color: #111827;
          text-decoration: none;
        }

        :global(.museum-compact-card__content h3 a:hover) {
          text-decoration: underline;
        }

        :global(.museum-compact-card__summary) {
          margin: 0;
          color: #374151;
          font-size: 0.9rem;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        :global(.museum-compact-card--small .museum-compact-card__summary) {
          -webkit-line-clamp: 1;
          font-size: 0.86rem;
        }

        :global(.museum-compact-card__credit) {
          margin: 0;
          color: #6b7280;
          font-size: 0.72rem;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        :global(.museum-compact-card__actions) {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
        }

        :global(.museum-compact-card__cta) {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          padding: 0.55rem 0.75rem;
          background: #0f172a;
          color: #ffffff;
          font-size: 0.85rem;
          text-decoration: none;
          font-weight: 600;
        }

        :global(.museum-compact-card__cta:hover) {
          background: #1e293b;
        }

        :global(.museum-compact-card__ticket) {
          color: #334155;
          font-size: 0.76rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          white-space: nowrap;
        }

        :global(.museum-compact-card__ticket:hover) {
          text-decoration: underline;
        }

        :global(.museum-compact-card__badge) {
          border: 1px solid #d1d5db;
          border-radius: 999px;
          padding: 0.08rem 0.4rem;
          font-size: 0.68rem;
          background: #f8fafc;
          color: #475569;
        }

        .museum-overview-section__subtitle {
          margin: 0 0 1rem;
        }

        @media (max-width: 1024px) {
          .museum-cards-grid,
          .museum-cards-grid--hidden,
          .quick-choice-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .museum-cards-grid,
          .museum-cards-grid--hidden,
          .quick-choice-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
