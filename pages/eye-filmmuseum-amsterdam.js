import Link from 'next/link';
import SEO from '../components/SEO';
import { getStaticMuseumBySlug } from '../lib/staticMuseums';

const RELATED_MUSEUMS = [
  {
    slug: 'stedelijk-museum-amsterdam',
    reason:
      'Sterke match als je van visuele cultuur en moderne kunst houdt. Je combineert hier kunst, design en vernieuwende tentoonstellingen.',
  },
  {
    slug: 'nxt-museum-amsterdam',
    reason:
      'Interessant voor bezoekers die film, licht en digitale installaties waarderen. De beleving is vaak immersief en experimenteel.',
  },
  {
    slug: 'moco-museum-amsterdam',
    reason:
      'Populair bij wie hedendaagse kunst zoekt die toegankelijk en visueel sterk is. Fijn als je naast Eye nog iets moderns wilt zien.',
  },
  {
    slug: 'rijksmuseum-amsterdam',
    reason:
      'Goede aanvulling wanneer je je dag wilt verbreden met Nederlandse kunst- en cultuurgeschiedenis in een groot museum.',
  },
  {
    slug: 'van-gogh-museum-amsterdam',
    reason:
      'Ideaal als je vooral geïnteresseerd bent in beeldtaal, kleur en artistieke ontwikkeling binnen één sterke collectie.',
  },
  {
    slug: 'foam-fotografiemuseum-amsterdam',
    reason:
      'Past bij dezelfde doelgroep die visuele verhalen waardeert. FOAM is compact en daardoor makkelijk te combineren met andere stops.',
  },
];

const practicalInfo = [
  { label: 'Locatie', value: 'IJpromenade 1, Amsterdam-Noord (tegenover Amsterdam Centraal)' },
  { label: 'Gemiddelde bezoektijd', value: 'Ongeveer 1,5 tot 2,5 uur' },
  { label: 'Soort museum', value: 'Film, cultuur en moderne beeldtaal' },
  {
    label: 'Geschikt voor',
    value: 'Filmliefhebbers, architectuurliefhebbers, solo-bezoekers en een regenachtige dag in Amsterdam',
  },
];

function RelatedMuseumCard({ slug, reason }) {
  const museum = getStaticMuseumBySlug(slug);
  if (!museum) return null;

  return (
    <li className="guide-hub-item">
      <Link href={`/museum/${museum.slug}`} className="guide-hub-item__link" aria-label={`Bekijk ${museum.naam}`}>
        <h3 className="guide-hub-item__title">{museum.naam}</h3>
        <p className="guide-hub-item__description">
          {museum.samenvatting} {reason}
        </p>
        <span className="guide-hub-item__button" aria-hidden="true">
          bekijk museum <span aria-hidden="true">→</span>
        </span>
      </Link>
    </li>
  );
}

export default function EyeFilmmuseumAmsterdamPage() {
  const title = 'Eye Filmmuseum Amsterdam – praktische info en tips | MuseumBuddy';
  const description =
    'Eye Filmmuseum in Amsterdam bezoeken? Lees praktische info, tips en ontdek andere musea die goed passen bij film- en cultuurliefhebbers.';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: 'Eye Filmmuseum',
    description,
    url: 'https://museumbuddy.nl/eye-filmmuseum-amsterdam',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'IJpromenade 1',
      addressLocality: 'Amsterdam',
      addressCountry: 'NL',
    },
  };

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical="/eye-filmmuseum-amsterdam"
        robots="index,follow"
        structuredData={structuredData}
      />

      <section className="page-intro">
        <h1 className="page-title">Eye Filmmuseum Amsterdam – praktische info en tips</h1>
        <p className="page-subtitle">
          Wil je Eye Filmmuseum bezoeken en snel weten of het bij je past? Op deze pagina vind je de belangrijkste
          praktische informatie, plus slimme doorkliktips naar vergelijkbare musea in Amsterdam.
        </p>
      </section>

      <section className="museum-guide-section">
        <h2>Praktische info</h2>
        <ul className="museum-guide-practical-list">
          {practicalInfo.map((item) => (
            <li key={item.label} className="museum-guide-practical-item">
              <span className="museum-guide-practical-label">{item.label}</span>
              <span className="museum-guide-practical-value">{item.value}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="museum-guide-section">
        <h2>Waarom Eye Filmmuseum bijzonder is</h2>
        <p>
          Eye Filmmuseum combineert architectuur, filmgeschiedenis en actuele filmcultuur op één plek. Je bezoekt er
          niet alleen tentoonstellingen over cinema en makers, maar ook presentaties waarin beeld, geluid en verhaal op
          een moderne manier samenkomen.
        </p>
        <p>
          Bezoekers kiezen Eye vaak omdat het meer is dan een klassiek museumbezoek: je kunt collectie, tijdelijke
          exposities en filmprogramma&apos;s combineren in één dagdeel. Daardoor is het aantrekkelijk voor zowel
          doorgewinterde filmfans als bezoekers die gewoon een cultureel en inspirerend binnenprogramma zoeken.
        </p>
      </section>

      <section className="museum-guide-section">
        <h2>Andere musea die je misschien ook interessant vindt</h2>
        <p className="museum-guide-section-intro">
          Zoek je vergelijkbare beleving of wil je je museumdag uitbreiden? Deze musea sluiten goed aan bij bezoekers
          die ook Eye Filmmuseum overwegen.
        </p>
        <ul className="guide-hub-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {RELATED_MUSEUMS.map((museum) => (
            <RelatedMuseumCard key={museum.slug} slug={museum.slug} reason={museum.reason} />
          ))}
        </ul>
      </section>

      <section className="museum-guide-section">
        <h2>Meer categorieën om verder te vergelijken</h2>
        <div className="museum-guide-link-grid">
          <Link href="/beste-musea-amsterdam" className="museum-guide-link-button">
            Beste Musea in Amsterdam <span aria-hidden="true">→</span>
          </Link>
          <Link href="/kindvriendelijke-musea-amsterdam" className="museum-guide-link-button">
            Kindvriendelijke musea in Amsterdam <span aria-hidden="true">→</span>
          </Link>
          <Link href="/moderne-kunst-musea-amsterdam" className="museum-guide-link-button">
            Musea met moderne kunst <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
