import Link from 'next/link';
import SEO from '../components/SEO';
import MuseumCard from '../components/MuseumCard';
import { useLanguage } from '../components/LanguageContext';
import museumImages from './museumImages';
import museumImageCredits from './museumImageCredits';
import { getStaticMuseums } from './staticMuseums';
import { getMuseumCategories } from './museumCategories';
import { DEFAULT_TIME_ZONE, isMuseumOpenNow } from './openingHours';

const CENTRUM_SLUGS = new Set([
  'allard-pierson-amsterdam',
  'amsterdam-museum-amsterdam',
  'anne-frank-huis-amsterdam',
  'body-worlds-amsterdam',
  'foam-fotografiemuseum-amsterdam',
  'hart-museum-amsterdam',
  'het-grachtenmuseum-amsterdam',
  'huis-marseille-amsterdam',
  'joods-museum-amsterdam',
  'kattenkabinet-amsterdam',
  'museum-van-loon-amsterdam',
  'ons-lieve-heer-op-solder-amsterdam',
  'rembrandthuis-amsterdam',
  'rijksmuseum-amsterdam',
  'van-gogh-museum-amsterdam',
  'woonbootmuseum-amsterdam',
]);

function toCardMuseum(museum) {
  return {
    ...museum,
    image: museumImages[museum.slug] || museum.afbeelding_url || museum.image_url || null,
    imageCredit: museumImageCredits[museum.slug],
  };
}

function sortByName(museums) {
  return [...museums].sort((a, b) => a.naam.localeCompare(b.naam));
}

function hasCategory(museum, category) {
  return getMuseumCategories(museum.slug).includes(category);
}

function getMuseumsForLanding(config) {
  const museums = getStaticMuseums();
  const filtered = museums.filter((museum) => {
    if (config.category && !hasCategory(museum, config.category)) return false;
    if (config.onlyCentrum && !CENTRUM_SLUGS.has(museum.slug)) return false;
    if (config.onlyOpenToday && isMuseumOpenNow(museum, { timeZone: DEFAULT_TIME_ZONE }) !== true) return false;
    return true;
  });
  return sortByName(filtered).map(toCardMuseum);
}

export const LANDING_PAGE_CONFIGS = {
  '/moderne-kunst-musea-amsterdam': {
    category: 'modern-art',
    title: {
      nl: 'Moderne kunst musea Amsterdam: hedendaagse en moderne favorieten | MuseumBuddy',
      en: 'Modern art museums Amsterdam: contemporary and modern picks | MuseumBuddy',
    },
    heading: {
      nl: 'Moderne kunst musea in Amsterdam',
      en: 'Modern art museums in Amsterdam',
    },
    description: {
      nl: 'Ontdek moderne kunst musea in Amsterdam, van Stedelijk en Moco tot STRAAT en digitale kunst bij Nxt Museum.',
      en: 'Discover modern art museums in Amsterdam, from Stedelijk and Moco to STRAAT and digital art at Nxt Museum.',
    },
    intro: {
      nl: 'Zoek je moderne kunst in Amsterdam? Deze landingspagina bundelt musea waar moderne, hedendaagse, digitale of street art centraal staat. Gebruik de selectie als startpunt voor een museumroute met design, iconische moderne kunst en experimentele beeldcultuur.',
      en: 'Looking for modern art in Amsterdam? This landing page brings together museums focused on modern, contemporary, digital or street art. Use it as a starting point for a route with design, iconic modern art and experimental visual culture.',
    },
    faq: {
      nl: [
        ['Welk museum voor moderne kunst is een logische eerste keuze?', 'Stedelijk Museum Amsterdam is de klassieke eerste keuze voor moderne en hedendaagse kunst. Moco, STRAAT en Nxt Museum zijn sterke aanvullingen voor specifieke stijlen.'],
        ['Is dit hetzelfde als alle kunstmusea in Amsterdam?', 'Nee. Deze pagina focust op moderne en hedendaagse intentie; algemene kunstmusea staan op bredere categoriepagina’s of museumprofielen.'],
      ],
      en: [
        ['Which modern art museum is a logical first pick?', 'Stedelijk Museum Amsterdam is the classic first pick for modern and contemporary art. Moco, STRAAT and Nxt Museum add more specific styles.'],
        ['Is this the same as every art museum in Amsterdam?', 'No. This page focuses on modern and contemporary intent; broader art museums are covered on category pages and museum profiles.'],
      ],
    },
  },
  '/musea-amsterdam-centrum': {
    onlyCentrum: true,
    title: { nl: 'Musea Amsterdam Centrum: musea op loopafstand | MuseumBuddy', en: 'Museums Amsterdam city centre: walkable picks | MuseumBuddy' },
    heading: { nl: 'Musea in Amsterdam Centrum', en: 'Museums in Amsterdam city centre' },
    description: { nl: 'Plan musea in Amsterdam Centrum met een praktische selectie rond de grachten, Dam, Jordaan en Museumplein.', en: 'Plan museums in Amsterdam city centre with a practical selection around the canals, Dam, Jordaan and Museumplein.' },
    intro: { nl: 'Wil je musea combineren zonder lange reistijd? Deze pagina verzamelt musea die praktisch zijn voor een dag in of rond Amsterdam Centrum, inclusief bekende highlights en kleinere plekken dicht bij populaire routes.', en: 'Want to combine museums without long travel times? This page collects museums that are practical for a day in or around central Amsterdam, including famous highlights and smaller places near popular routes.' },
  },
  '/musea-amsterdam-vandaag-open': {
    onlyOpenToday: true,
    title: { nl: 'Musea Amsterdam vandaag open: actuele shortlist | MuseumBuddy', en: 'Amsterdam museums open today: current shortlist | MuseumBuddy' },
    heading: { nl: 'Musea in Amsterdam die vandaag open zijn', en: 'Amsterdam museums open today' },
    description: { nl: 'Bekijk een praktische shortlist van Amsterdamse musea die volgens onze openingstijden vandaag open zijn. Controleer altijd de officiële site.', en: 'See a practical shortlist of Amsterdam museums that are open today based on our opening-hours data. Always check the official site.' },
    intro: { nl: 'Deze pagina vertaalt de filter “vandaag open” naar een indexeerbare SEO-landingspagina. Openingstijden kunnen wijzigen door feestdagen, evenementen of uitzonderingen; controleer daarom altijd de officiële museumwebsite voordat je vertrekt.', en: 'This page turns the “open today” filter into an indexable SEO landing page. Opening hours can change due to holidays, events or exceptions, so always check the official museum website before you go.' },
  },
  '/fotografie-musea-amsterdam': {
    category: 'photography',
    title: { nl: 'Fotografie musea Amsterdam: FOAM, Huis Marseille en meer | MuseumBuddy', en: 'Photography museums Amsterdam: FOAM, Huis Marseille and more | MuseumBuddy' },
    heading: { nl: 'Fotografie musea in Amsterdam', en: 'Photography museums in Amsterdam' },
    description: { nl: 'Vind fotografie musea in Amsterdam, waaronder FOAM en Huis Marseille, met praktische tips voor je museumdag.', en: 'Find photography museums in Amsterdam, including FOAM and Huis Marseille, with practical tips for your museum day.' },
    intro: { nl: 'Amsterdam heeft een compacte maar sterke fotografiescene. Deze pagina bundelt musea waar fotografie, beeldcultuur en fototentoonstellingen een duidelijke rol spelen.', en: 'Amsterdam has a compact but strong photography scene. This page brings together museums where photography, visual culture and photo exhibitions play a clear role.' },
  },
  '/geschiedenis-musea-amsterdam': {
    category: 'history',
    title: { nl: 'Geschiedenis musea Amsterdam: verhalen over stad en verleden | MuseumBuddy', en: 'History museums Amsterdam: stories about the city and past | MuseumBuddy' },
    heading: { nl: 'Geschiedenis musea in Amsterdam', en: 'History museums in Amsterdam' },
    description: { nl: 'Ontdek geschiedenis musea in Amsterdam, van Anne Frank Huis en Amsterdam Museum tot scheepvaart, grachten en verborgen kerken.', en: 'Discover history museums in Amsterdam, from the Anne Frank House and Amsterdam Museum to maritime history, canals and hidden churches.' },
    intro: { nl: 'Voor bezoekers die Amsterdam beter willen begrijpen, zijn geschiedenismusea vaak de beste ingang. Deze selectie helpt je kiezen tussen stadsgeschiedenis, Joodse geschiedenis, maritieme verhalen, grachtenhuizen en religieus erfgoed.', en: 'For visitors who want to understand Amsterdam better, history museums are often the best entry point. This selection helps you choose between city history, Jewish history, maritime stories, canal houses and religious heritage.' },
  },
};

export function FilterLandingPage({ config, canonicalPath }) {
  const { lang } = useLanguage();
  const locale = lang === 'en' ? 'en' : 'nl';
  const museums = getMuseumsForLanding(config);
  const faqItems = (config.faq?.[locale] || []).map(([question, answer]) => ({ question, answer }));
  const heading = config.heading[locale];
  const description = config.description[locale];
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
    faqItems.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
          })),
        }
      : null,
  ].filter(Boolean);

  return (
    <>
      <SEO
        title={config.title[locale]}
        description={description}
        canonical={canonicalPath}
        image="/images/og-home.svg"
        structuredData={structuredData}
      />
      <section className="page-intro">
        <h1 className="page-title">{heading}</h1>
        <p className="page-subtitle">{config.intro[locale]}</p>
      </section>
      {faqItems.length ? (
        <section className="museum-guide-section" aria-labelledby="landing-faq-heading">
          <h2 id="landing-faq-heading">{locale === 'en' ? 'Quick answers' : 'Snelle antwoorden'}</h2>
          {faqItems.map((item) => (
            <details key={item.question} className="guide-faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </section>
      ) : null}
      <p>
        <Link href="/">{locale === 'en' ? 'View all museums' : 'Bekijk alle musea'}</Link>{' '}
        {locale === 'en'
          ? 'or refine your choice with the interactive filters on the homepage.'
          : 'of verfijn je keuze met de interactieve filters op de homepage.'}
      </p>
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
        <p>{locale === 'en' ? 'No museums found for this selection yet.' : 'Nog geen musea gevonden voor deze selectie.'}</p>
      )}
    </>
  );
}
