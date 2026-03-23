import SEO from '../components/SEO';
import MuseumCard from '../components/MuseumCard';
import { useLanguage } from '../components/LanguageContext';
import museumImages from '../lib/museumImages';
import museumImageCredits from '../lib/museumImageCredits';
import { getStaticMuseums } from '../lib/staticMuseums';
import kidFriendlyMuseums from '../lib/kidFriendlyMuseums';

const KID_FRIENDLY_SET = new Set(kidFriendlyMuseums.map((slug) => slug.toLowerCase()));

function toCardMuseum(museum) {
  return {
    ...museum,
    image: museumImages[museum.slug] || museum.afbeelding_url || museum.image_url || null,
    imageCredit: museumImageCredits[museum.slug],
  };
}

export default function KidFriendlyMuseumsLandingPage() {
  const { lang } = useLanguage();
  const title =
    lang === 'en'
      ? 'Our curated selection of kid-friendly museums in Amsterdam | MuseumBuddy'
      : 'Onze selectie kindvriendelijke musea in Amsterdam | MuseumBuddy';
  const description =
    lang === 'en'
      ? "Discover MuseumBuddy's curated selection of kid-friendly museums in Amsterdam, chosen for interactive and family-friendly experiences."
      : "Ontdek MuseumBuddy's selectie kindvriendelijke musea in Amsterdam, gekozen op interactieve en gezinsvriendelijke museumervaringen.";
  const heading =
    lang === 'en'
      ? 'Our curated selection of kid-friendly museums in Amsterdam'
      : 'Onze selectie kindvriendelijke musea in Amsterdam';
  const intro =
    lang === 'en'
      ? `Looking for kid-friendly museums in Amsterdam? This page is a curated editorial selection by MuseumBuddy, not a complete overview of every family museum in the city. We focus on places that can work especially well for families because they offer interactive elements, clear storytelling, visual experiences, or themes that often appeal to children. Each museum in this selection is included because we believe it can provide a strong starting point for a family museum day in Amsterdam.\n\nFamilies differ in age, interests, and attention span, so a museum that is great for one child may be less suitable for another. We therefore recommend checking the museum's own website for current exhibitions, opening hours, ticket conditions, and any age-specific activities before you visit. Use this page as a practical shortlist you can trust: carefully chosen options, transparent positioning, and realistic expectations for planning a museum outing with children.`
      : `Op zoek naar kindvriendelijke musea in Amsterdam? Deze pagina is een redactionele selectie van MuseumBuddy en geen volledige lijst van alle gezinsvriendelijke musea in de stad. We kiezen musea die vaak goed werken voor gezinnen, bijvoorbeeld door interactieve onderdelen, duidelijke verhaallijnen, visuele beleving of thema's die veel kinderen aanspreken. Elk museum op deze pagina staat hier omdat wij denken dat het een sterk startpunt kan zijn voor een museumdag met kinderen in Amsterdam.\n\nGezinnen verschillen in leeftijd, interesses en aandachtsspanne. Een museum dat perfect is voor het ene kind, past daarom niet altijd even goed bij het andere. Controleer vóór je bezoek altijd de website van het museum voor actuele tentoonstellingen, openingstijden, ticketinformatie en eventuele leeftijdsgerichte activiteiten. Zie deze pagina als een betrouwbare shortlist: zorgvuldig geselecteerd, transparant gepositioneerd en bedoeld om realistische verwachtingen te geven.`;

  const museums = getStaticMuseums()
    .filter((museum) => KID_FRIENDLY_SET.has((museum.slug || '').toLowerCase()))
    .map(toCardMuseum);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: heading,
    description,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: museums.length,
      itemListElement: museums.map((museum, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://museumbuddy.nl/museum/${museum.slug}`,
        name: museum.naam,
      })),
    },
  };

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical="/kindvriendelijke-musea-amsterdam"
        image="/images/og-home.svg"
        structuredData={structuredData}
      />
      <section className="page-intro">
        <h1 className="page-title">{heading}</h1>
        {intro.split('\n\n').map((paragraph) => (
          <p key={paragraph} className="page-subtitle">
            {paragraph}
          </p>
        ))}
      </section>
      <p className="count">{museums.length} musea</p>
      {museums.length ? (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {museums.map((museum, index) => (
            <li key={museum.slug}>
              <MuseumCard museum={museum} priority={index < 3} />
            </li>
          ))}
        </ul>
      ) : (
        <p>{lang === 'en' ? 'No kid-friendly museums found yet.' : 'Nog geen kindvriendelijke musea gevonden.'}</p>
      )}
    </>
  );
}
