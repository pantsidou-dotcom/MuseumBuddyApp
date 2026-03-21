import Link from 'next/link';
import SEO from '../components/SEO';
import MuseumCard from '../components/MuseumCard';
import { useLanguage } from '../components/LanguageContext';
import museumImages from '../lib/museumImages';
import museumImageCredits from '../lib/museumImageCredits';
import { getStaticMuseums } from '../lib/staticMuseums';

function toCardMuseum(museum) {
  return {
    ...museum,
    image: museumImages[museum.slug] || museum.afbeelding_url || museum.image_url || null,
    imageCredit: museumImageCredits[museum.slug],
  };
}

function isFreeMuseum(museum) {
  return Boolean(museum?.gratis_toegankelijk);
}

export default function FreeMuseumsLandingPage() {
  const { lang } = useLanguage();
  const title =
    lang === 'en'
      ? 'Free museums in Amsterdam | MuseumBuddy'
      : 'Gratis musea in Amsterdam | MuseumBuddy';
  const description =
    lang === 'en'
      ? 'Find museums in Amsterdam with free admission where available.'
      : 'Vind musea in Amsterdam met gratis toegang waar beschikbaar.';
  const heading = lang === 'en' ? 'Free museums in Amsterdam' : 'Gratis musea in Amsterdam';
  const intro =
    lang === 'en'
      ? 'A practical list of museums in Amsterdam that are marked as free to visit.'
      : 'Een praktisch overzicht van musea in Amsterdam die als gratis toegankelijk zijn gemarkeerd.';

  const museums = getStaticMuseums().filter(isFreeMuseum).map(toCardMuseum);
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
        canonical="/gratis-musea-amsterdam"
        image="/images/og-home.svg"
        structuredData={structuredData}
      />
      <section className="page-intro">
        <h1 className="page-title">{heading}</h1>
        <p className="page-subtitle">{intro}</p>
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
        <p>
          {lang === 'en'
            ? 'No free museums are marked in the current data yet. You can still browse all museums.'
            : 'Er zijn in de huidige dataset nog geen gratis musea gemarkeerd. Je kunt wel alle musea bekijken.'}{' '}
          <Link href="/">
            {lang === 'en' ? 'View all museums' : 'Bekijk alle musea'}
          </Link>
          .
        </p>
      )}
    </>
  );
}
