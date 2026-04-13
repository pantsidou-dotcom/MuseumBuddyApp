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

function MuseumSellCard({ slug, whyVisit }) {
  const museum = getMuseum(slug);
  if (!museum) return null;

  const ticketUrl = museum.ticket_affiliate_url || museum.website_url;
  const imageSource = museumImages[museum.slug];

  return (
    <article className="museum-sell-card">
      <Link href={`/museum/${museum.slug}`} className="museum-sell-card__image-link" aria-label={`Bekijk ${museum.naam}`}>
        <div className="museum-sell-card__image-wrap">
          {imageSource ? (
            <Image
              src={imageSource}
              alt={museum.naam}
              fill
              className="museum-sell-card__image"
              sizes="(max-width: 720px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="museum-sell-card__image-fallback" />
          )}
        </div>
      </Link>

      <div className="museum-sell-card__content">
        <h3>
          <Link href={`/museum/${museum.slug}`}>{museum.naam}</Link>
        </h3>
        <p>
          {museum.samenvatting} {whyVisit}
        </p>

        <div className="museum-sell-card__actions">
          <Link href={`/museum/${museum.slug}`} className="museum-sell-card__detail-btn">
            Meer info
          </Link>
          {ticketUrl ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="sponsored noopener noreferrer"
              className="ticket-button museum-sell-card__ticket-btn"
              aria-label={`Koop tickets voor ${museum.naam}`}
            >
              Koop tickets
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

      <section style={{ marginBottom: '2rem' }}>
        <h2>De bekendste musea in Amsterdam</h2>
        <div className="museum-sell-grid">
          <MuseumSellCard
            slug="rijksmuseum-amsterdam"
            whyVisit="Een sterke keuze als je in één bezoek zowel kunst als Nederlandse geschiedenis wilt meepakken, met een brede opzet voor verschillende interesses."
          />
          <MuseumSellCard
            slug="van-gogh-museum-amsterdam"
            whyVisit="Een aanrader voor wie gericht de werken en ontwikkeling van Van Gogh wil ontdekken in een museum dat volledig rond zijn oeuvre is opgebouwd."
          />
          <MuseumSellCard
            slug="anne-frank-huis-amsterdam"
            whyVisit="Dit museum maakt veel indruk door de historische context en de directe koppeling met een van de bekendste verhalen uit de twintigste eeuw."
          />
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Minder bekende, maar bijzondere musea</h2>
        <div className="museum-sell-grid">
          <MuseumSellCard
            slug="micropia-museum-amsterdam"
            whyVisit="Bijzonder door het specifieke thema: je ontdekt een onzichtbare wereld die je in traditionele kunstmusea niet tegenkomt."
          />
          <MuseumSellCard
            slug="het-schip-amsterdam"
            whyVisit="Interessant als je meer wilt begrijpen over Amsterdamse architectuur en hoe ontwerp, wonen en stadsgeschiedenis samenkomen."
          />
          <MuseumSellCard
            slug="huis-marseille-amsterdam"
            whyVisit="Een goede optie voor fotografieliefhebbers die liever een compacter museum kiezen met een duidelijke focus."
          />
          <MuseumSellCard
            slug="nxt-museum-amsterdam"
            whyVisit="Sterk voor bezoekers die moderne, immersieve installaties zoeken in plaats van een klassieke museumroute."
          />
          <MuseumSellCard
            slug="woonbootmuseum-amsterdam"
            whyVisit="Uniek doordat het concreet laat zien hoe wonen op het water eruitziet, iets dat nauw verbonden is met de stad zelf."
          />
        </div>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2>Welk museum past bij jou?</h2>
        <ul>
          {GROUPS.map((group) => (
            <li key={group.title}>
              <strong>{group.title}:</strong> <MuseumInlineLinks slugs={group.museums} />.
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
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

      <section style={{ marginBottom: '2rem' }}>
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
        .museum-sell-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
          margin-top: 0.9rem;
        }

        .museum-sell-card {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.28);
          background: var(--surface);
          box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
          display: flex;
          flex-direction: column;
        }

        .museum-sell-card__image-link {
          display: block;
        }

        .museum-sell-card__image-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 16 / 10;
          overflow: hidden;
        }

        .museum-sell-card__image {
          object-fit: cover;
          transition: transform 0.35s ease;
        }

        .museum-sell-card:hover .museum-sell-card__image {
          transform: scale(1.04);
        }

        .museum-sell-card__image-fallback {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #c7d2fe, #bfdbfe);
        }

        .museum-sell-card__content {
          padding: 0.85rem 0.85rem 1rem;
        }

        .museum-sell-card h3 {
          margin: 0;
          font-size: 1rem;
          line-height: 1.3;
        }

        .museum-sell-card p {
          margin: 0.6rem 0 0;
          font-size: 0.9rem;
          line-height: 1.5;
          color: var(--text-secondary);
        }

        .museum-sell-card__actions {
          margin-top: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          flex-wrap: wrap;
        }

        .museum-sell-card__detail-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          padding: 0.4rem 0.65rem;
          text-decoration: none;
          color: var(--text-primary);
          font-size: 0.8rem;
          font-weight: 600;
        }

        .museum-sell-card__ticket-btn {
          padding: 0.42rem 0.72rem;
          border-radius: 10px;
          font-size: 0.8rem;
        }
      `}</style>
    </>
  );
}
