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
      ? 'Kid-friendly museums Amsterdam: hands-on family picks | MuseumBuddy'
      : 'Kindvriendelijke musea Amsterdam: interactieve gezinstips | MuseumBuddy';
  const description =
    lang === 'en'
      ? 'Find kid-friendly museums in Amsterdam, including hands-on children’s museum picks such as NEMO, Micropia, maritime stories, street art and cats.'
      : 'Vind kindvriendelijke musea in Amsterdam, met interactieve gezinstips zoals NEMO, Micropia, maritieme verhalen, street art en katten.';
  const heading =
    lang === 'en'
      ? 'Kid-friendly museums in Amsterdam'
      : 'Kindvriendelijke musea in Amsterdam';
  const intro =
    lang === 'en'
      ? `Looking for kid-friendly museums in Amsterdam? This page is a curated editorial selection by MuseumBuddy, not a complete overview of every family museum in the city. We focus on places that can work especially well for families because they offer interactive elements, clear storytelling, visual experiences, or themes that often appeal to children. Each museum in this selection is included because we believe it can provide a strong starting point for a family museum day in Amsterdam.\n\nFamilies differ in age, interests, and attention span, so a museum that is great for one child may be less suitable for another. We therefore recommend checking the museum's own website for current exhibitions, opening hours, ticket conditions, and any age-specific activities before you visit. Use this page as a practical shortlist you can trust: carefully chosen options, transparent positioning, and realistic expectations for planning a museum outing with children.`
      : `Op zoek naar kindvriendelijke musea in Amsterdam? Deze pagina is een redactionele selectie van MuseumBuddy en geen volledige lijst van alle gezinsvriendelijke musea in de stad. We kiezen musea die vaak goed werken voor gezinnen, bijvoorbeeld door interactieve onderdelen, duidelijke verhaallijnen, visuele beleving of thema's die veel kinderen aanspreken. Elk museum op deze pagina staat hier omdat wij denken dat het een sterk startpunt kan zijn voor een museumdag met kinderen in Amsterdam.\n\nGezinnen verschillen in leeftijd, interesses en aandachtsspanne. Een museum dat perfect is voor het ene kind, past daarom niet altijd even goed bij het andere. Controleer vóór je bezoek altijd de website van het museum voor actuele tentoonstellingen, openingstijden, ticketinformatie en eventuele leeftijdsgerichte activiteiten. Zie deze pagina als een betrouwbare shortlist: zorgvuldig geselecteerd, transparant gepositioneerd en bedoeld om realistische verwachtingen te geven.`;

  const museums = getStaticMuseums()
    .filter((museum) => KID_FRIENDLY_SET.has((museum.slug || '').toLowerCase()))
    .map(toCardMuseum);

  const faqItems =
    lang === 'en'
      ? [
          {
            question: 'Which hands-on children’s museum in Amsterdam is a good first pick?',
            answer:
              'NEMO Science Museum is usually the clearest hands-on first pick because it focuses on interactive science exhibits. Micropia and Het Scheepvaartmuseum can also work well for curious children.',
          },
          {
            question: 'Are all museums on this page suitable for every age?',
            answer:
              'No. The selection is a practical shortlist, but ages, interests and attention span differ per family. Always check current activities, tickets and opening hours before visiting.',
          },
        ]
      : [
          {
            question: 'Welk interactief kindermuseum in Amsterdam is een goede eerste keuze?',
            answer:
              'NEMO Science Museum is meestal de duidelijkste hands-on keuze door de interactieve wetenschapsexposities. Ook Micropia en Het Scheepvaartmuseum kunnen goed werken voor nieuwsgierige kinderen.',
          },
          {
            question: 'Zijn alle musea op deze pagina geschikt voor elke leeftijd?',
            answer:
              'Nee. De selectie is een praktische shortlist, maar leeftijden, interesses en aandachtsspanne verschillen per gezin. Controleer altijd actuele activiteiten, tickets en openingstijden voor je bezoek.',
          },
        ];

  const structuredData = [
    {
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
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ];

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
      <section className="museum-guide-section" aria-labelledby="family-faq-heading">
        <h2 id="family-faq-heading">
          {lang === 'en' ? 'Quick answers for families' : 'Snelle antwoorden voor gezinnen'}
        </h2>
        {faqItems.map((item) => (
          <details key={item.question} className="guide-faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
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
