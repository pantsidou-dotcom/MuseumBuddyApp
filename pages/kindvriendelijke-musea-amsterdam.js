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
      ? 'Kid-friendly museums in Amsterdam | MuseumBuddy'
      : 'Kindvriendelijke musea in Amsterdam | MuseumBuddy';
  const description =
    lang === 'en'
      ? 'Discover kid-friendly museums in Amsterdam for a fun family day out.'
      : 'Ontdek kindvriendelijke musea in Amsterdam voor een leuke dag uit met het gezin.';
  const heading = lang === 'en' ? 'Kid-friendly museums in Amsterdam' : 'Kindvriendelijke musea in Amsterdam';
  const intro =
    lang === 'en'
      ? 'These museums are selected as family-friendly and are a great starting point for visiting Amsterdam with children.'
      : 'Deze musea zijn geselecteerd als kindvriendelijk en vormen een goed startpunt voor een museumdag met kinderen in Amsterdam.';

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
        <p>{lang === 'en' ? 'No kid-friendly museums found yet.' : 'Nog geen kindvriendelijke musea gevonden.'}</p>
      )}
    </>
  );
}
