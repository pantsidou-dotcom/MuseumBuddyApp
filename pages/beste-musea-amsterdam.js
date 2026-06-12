import Image from 'next/image';
import Link from 'next/link';
import SEO from '../components/SEO';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
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
      {creditLine ? <p className="museum-compact-card__credit">{creditLine}</p> : null}

      <div className="museum-compact-card__content">
        <h3>
          <Link href={`/museum/${museum.slug}`}>{museum.naam}</Link>
        </h3>

        <p className="museum-compact-card__summary">{museum.samenvatting}</p>

        <div className="museum-compact-card__actions">
          <Button href={`/museum/${museum.slug}`} variant="primary" className="museum-compact-card__action-button">
            Bekijk museum
          </Button>
          {hasTickets ? (
            <Button
              as="a"
              href={museum.ticket_affiliate_url}
              target="_blank"
              rel="sponsored noopener noreferrer"
              variant="secondary"
              className="museum-compact-card__action-button museum-compact-card__action-button--secondary"
            >
              Tickets <Badge size="sm">Partner</Badge>
            </Button>
          ) : null}
        </div>

        {hasTickets ? (
          <p className="museum-compact-card__affiliate-note">
            Je koopt tickets via een affiliate partner. MuseumBuddy ontvangt mogelijk commissie bij aankoop via deze
            link. Prijzen kunnen afwijken.
          </p>
        ) : null}
      </div>
    </article>
  );
}

export default function BestMuseumsAmsterdamPage() {
  const title = 'Beste musea Amsterdam: topkeuzes en verborgen parels | MuseumBuddy';
  const description =
    'Vergelijk de beste musea in Amsterdam: Rijksmuseum, Van Gogh, Anne Frank Huis, moderne kunst, fotografie, wetenschap en verborgen parels voor je bezoek.';

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
          padding: 0.3rem 0.8rem 0.25rem;
          color: #6b7280;
          font-size: 0.62rem;
          line-height: 1.25;
          border-top: 1px solid #eef2f7;
          background: #fcfdff;
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

        :global(.museum-compact-card__action-button) {
          font-size: 0.9375rem;
          min-height: 36px;
          white-space: nowrap;
        }

        :global(.museum-compact-card__action-button.ds-button--primary) {
          color: #ffffff;
        }

        :global(.museum-compact-card__action-button.ds-button--primary:hover) {
          color: #ffffff;
        }

        :global([data-theme='dark'] .museum-compact-card__action-button.ds-button--primary) {
          color: #ffffff;
        }

        :global(.museum-compact-card__action-button--secondary) {
          gap: var(--ds-space-1);
        }

        :global(.museum-compact-card__action-button--secondary .ds-badge) {
          margin-left: 2px;
        }

        :global(.museum-compact-card__affiliate-note) {
          margin: 0.1rem 0 0;
          color: #475569;
          font-size: 0.68rem;
          line-height: 1.35;
        }

        .museum-overview-section__subtitle {
          margin: 0 0 1rem;
        }

        @media (max-width: 1024px) {
          .museum-cards-grid,
          .museum-cards-grid--hidden {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .museum-cards-grid,
          .museum-cards-grid--hidden {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </>
  );
}
