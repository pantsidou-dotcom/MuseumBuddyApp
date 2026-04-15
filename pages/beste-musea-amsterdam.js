import Link from 'next/link';
import MuseumCard from '../components/MuseumCard';
import SEO from '../components/SEO';
import { getMuseumCategories } from '../lib/museumCategories';
import museumImageCredits from '../lib/museumImageCredits';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumTicketUrls from '../lib/museumTicketUrls';
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
    description: 'Musea voor een comfortabele binnenmiddag.',
    href: '#regenachtige-dag',
  },
  {
    title: 'Kort bezoek (1–2 uur)',
    description: 'Compacte keuzes als je weinig tijd hebt.',
    href: '#kort-bezoek',
  },
];

const RAINY_DAY_SLUGS = [
  'rijksmuseum-amsterdam',
  'van-gogh-museum-amsterdam',
  'stedelijk-museum-amsterdam',
  'nemo-science-museum-amsterdam',
];

const SHORT_VISIT_SLUGS = [
  'micropia-museum-amsterdam',
  'huis-marseille-amsterdam',
  'woonbootmuseum-amsterdam',
  'ons-lieve-heer-op-solder-amsterdam',
];

function getMuseum(slug) {
  return getStaticMuseumBySlug(slug);
}

function buildMuseumCardData(slug) {
  const museum = getMuseum(slug);
  if (!museum) return null;

  const ticketAffiliateUrl = museum.ticket_affiliate_url || museumTicketUrls[slug] || null;
  const ticketUrl = ticketAffiliateUrl || museum.website_url || null;

  return {
    id: museum.id,
    slug: museum.slug,
    title: museumNames[slug] || museum.naam,
    city: museum.stad,
    province: museum.provincie,
    free: museum.gratis_toegankelijk,
    categories: getMuseumCategories(slug),
    image: museumImages[slug] || null,
    imageCredit: museumImageCredits[slug],
    ticketUrl,
    ticketAffiliateUrl,
  };
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
      <span className="quick-choice-card__cta">
        Naar selectie <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}

function MuseumSelectionGrid({ slugs, compact = false }) {
  const cards = slugs.map(buildMuseumCardData).filter(Boolean);

  return (
    <div className={`museum-selection-grid${compact ? ' museum-selection-grid--compact' : ''}`}>
      {cards.map((museum, index) => (
        <article key={museum.slug}>
          <MuseumCard museum={museum} priority={!compact && index === 0} />
        </article>
      ))}
    </div>
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
        <div className="quick-choice-grid" role="navigation" aria-label="Snelle museumkeuzes">
          {QUICK_CHOICES.map((choice) => (
            <QuickChoiceCard key={choice.title} {...choice} />
          ))}
        </div>
      </section>

      <section className="content-section" aria-labelledby="populaire-musea">
        <h2 id="populaire-musea">De bekendste musea in Amsterdam</h2>
        <p className="section-intro">Deze kaarten volgen dezelfde opzet als op de homepage, inclusief ticketpartner-label en fotocredits.</p>
        <MuseumSelectionGrid slugs={FEATURED_SLUGS} />
      </section>

      <section className="content-section" aria-labelledby="bijzondere-musea">
        <h2 id="bijzondere-musea">Minder bekende, maar bijzondere musea</h2>
        <p className="section-intro">Voor wie iets anders zoekt dan de bekendste highlights, met een compactere kaartweergave.</p>
        <MuseumSelectionGrid slugs={HIDDEN_GEM_SLUGS} compact />
      </section>

      <section id="regenachtige-dag" className="content-section" aria-labelledby="regenachtige-dag-title">
        <h2 id="regenachtige-dag-title">Regenachtige dag: comfortabele binnenkeuzes</h2>
        <p className="section-intro">
          Deze keuzes zijn praktisch op natte dagen, omdat je er gemakkelijk langer binnen kunt blijven zonder dat je tempo hoog hoeft te liggen.
        </p>
        <MuseumSelectionGrid slugs={RAINY_DAY_SLUGS} compact />
      </section>

      <section id="kort-bezoek" className="content-section" aria-labelledby="kort-bezoek-title">
        <h2 id="kort-bezoek-title">Kort bezoek (1–2 uur): snel kiezen</h2>
        <p className="section-intro">
          Heb je weinig tijd? Deze musea zijn vaak geschikt voor een compacter bezoek. Klik door voor actuele openingstijden, details en tickets.
        </p>
        <MuseumSelectionGrid slugs={SHORT_VISIT_SLUGS} compact />
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
          max-width: 74ch;
          color: #374151;
        }

        .quick-choice-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.65rem;
        }

        .quick-choice-card {
          flex: 0 1 210px;
          min-width: 170px;
          max-width: 210px;
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          border: 1px solid #93c5fd;
          border-radius: 10px;
          padding: 0.72rem 0.8rem;
          text-decoration: none;
          color: inherit;
          background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.7), 0 4px 10px rgba(37, 99, 235, 0.12);
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
        }

        .quick-choice-card:hover,
        .quick-choice-card:focus-visible {
          border-color: #2563eb;
          box-shadow: 0 10px 20px rgba(37, 99, 235, 0.22);
          transform: translateY(-2px);
        }

        .quick-choice-card h3 {
          margin: 0;
          font-size: 0.98rem;
          line-height: 1.25;
        }

        .quick-choice-card p {
          margin: 0;
          color: #4b5563;
          font-size: 0.88rem;
          line-height: 1.35;
        }

        .quick-choice-card__cta {
          margin-top: 0.2rem;
          color: #1d4ed8;
          font-weight: 700;
          font-size: 0.84rem;
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
        }

        .museum-selection-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 260px));
          gap: 0.75rem;
          justify-content: flex-start;
        }

        .museum-selection-grid--compact {
          grid-template-columns: repeat(auto-fill, minmax(200px, 235px));
        }

        .museum-selection-grid :global(.museum-card) {
          height: 100%;
          --card-aspect-ratio: 16 / 9;
          border-radius: 12px;
        }

        .museum-selection-grid :global(.museum-card-actions),
        .museum-selection-grid :global(.museum-card-hours),
        .museum-selection-grid :global(.museum-card-tags),
        .museum-selection-grid :global(.museum-card-location),
        .museum-selection-grid :global(.museum-card-meta),
        .museum-selection-grid :global(.museum-card-meta-tag),
        .museum-selection-grid :global(.museum-card__affiliate-note) {
          display: none;
        }

        .museum-selection-grid :global(.museum-card-info) {
          padding: 0.7rem;
        }

        .museum-selection-grid :global(.museum-card-summary) {
          font-size: 0.82rem;
          line-height: 1.3;
          margin-top: 0.3rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .museum-selection-grid :global(.museum-card-title) {
          font-size: 0.98rem;
        }

        .museum-selection-grid--compact :global(.museum-card-info) {
          padding: 0.78rem;
        }

        .museum-selection-grid--compact :global(.museum-card-summary) {
          font-size: 0.84rem;
          line-height: 1.4;
        }
      `}</style>
    </>
  );
}
