import Link from 'next/link';
import SEO from '../components/SEO';
import MuseumCard from '../components/MuseumCard';
import { useLanguage } from '../components/LanguageContext';
import museumImages from '../lib/museumImages';
import museumImageCredits from '../lib/museumImageCredits';
import { getStaticMuseumBySlug } from '../lib/staticMuseums';

function toCardMuseum(museum) {
  if (!museum) return null;
  return {
    ...museum,
    image: museumImages[museum.slug] || museum.afbeelding_url || museum.image_url || null,
    imageCredit: museumImageCredits[museum.slug],
  };
}

const FEATURED_SLUGS = ['rijksmuseum-amsterdam', 'ons-lieve-heer-op-solder-amsterdam'];

export default function FreeMuseumsLandingPage() {
  const { lang } = useLanguage();

  const title =
    lang === 'en'
      ? 'Free museums in Amsterdam: what is truly free? | MuseumBuddy'
      : 'Gratis musea in Amsterdam: wat is écht gratis? | MuseumBuddy';
  const description =
    lang === 'en'
      ? 'Honest guide to free museum options in Amsterdam: truly free places, free moments, and ways to save with museum passes.'
      : 'Eerlijke gids over gratis musea in Amsterdam: wat echt gratis is, wanneer toegang soms gratis is en hoe je slim bespaart met museumpassen.';
  const heading =
    lang === 'en' ? 'Free museums in Amsterdam: what is truly free?' : 'Gratis musea in Amsterdam: wat is écht gratis?';

  const featuredMuseums = FEATURED_SLUGS.map((slug) => toCardMuseum(getStaticMuseumBySlug(slug))).filter(Boolean);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: heading,
    description,
    inLanguage: lang === 'en' ? 'en' : 'nl',
    mainEntityOfPage: 'https://museumbuddy.nl/gratis-musea-amsterdam',
  };

  return (
    <>
      <SEO
        title={title}
        description={description}
        robots="index,follow"
        canonical="/gratis-musea-amsterdam"
        image="/images/og-home.svg"
        structuredData={structuredData}
      />

      <section className="page-intro">
        <h1 className="page-title">{heading}</h1>
        <p className="page-subtitle">
          Amsterdam staat bekend om zijn musea, maar volledig gratis musea zijn zeldzaam. In deze gids leggen we
          eerlijk uit wat in Amsterdam echt gratis is, wanneer gratis toegang alleen in specifieke situaties geldt en
          hoe je je museumbezoek voordeliger plant.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <p>
          <strong>Belangrijk:</strong> gratis toegang verandert regelmatig. Controleer daarom altijd de actuele
          voorwaarden op de officiële ticketpagina van de locatie voordat je gaat.
        </p>

        <h2>Welke musea of museumplekken in Amsterdam zijn echt gratis?</h2>
        <p>
          Er zijn maar weinig plekken die je als “altijd gratis museum” kunt zien. Wel zijn er culturele locaties en
          museumonderdelen die gratis toegankelijk zijn:
        </p>
        <ul>
          <li>
            <strong>Stadsarchief Amsterdam</strong>: het gebouw is vrij toegankelijk, met gratis toegang tot onder meer
            het Informatiecentrum, de Studiezaal Originelen, de Schatkamer en de Filmzaal. Let op: voor exposities in
            de Tentoonstellingszaal geldt voor volwassenen wel een entreeprijs.
          </li>
          <li>
            <strong>Rijksmuseumtuinen</strong>: de tuinen zijn volgens het Rijksmuseum dagelijks open. Dat maakt dit een
            voorbeeld van gratis toegankelijke museumruimte, ook als het hoofdmuseum zelf betaald is.
          </li>
          <li>
            <strong>OSCAM</strong>: hanteert een “Pay As You Like”-model met bedragen vanaf €1. Dat is laagdrempelig,
            maar dus niet standaard volledig gratis.
          </li>
          <li>
            <strong>Ons&apos; Lieve Heer op Solder</strong>: er is volgens het museum bijna elke eerste zondag van de
            maand een mis in de zolderkerk. Dit betekent niet automatisch dat regulier museumbezoek dan gratis is;
            controleer agenda en ticketvoorwaarden vooraf.
          </li>
        </ul>

        <h2>Wanneer zijn musea gratis?</h2>
        <p>
          Veel musea zijn niet standaard gratis, maar wel in specifieke situaties. Denk bijvoorbeeld aan:
        </p>
        <ul>
          <li>gratis toegang voor kinderen of jongeren (per museum verschillend);</li>
          <li>gratis toegang op speciale dagen of bij specifieke publieksprogramma’s;</li>
          <li>gratis toegang tot een deel van een locatie (zoals tuin, publieksruimte of activiteit).</li>
        </ul>
        <p>
          Concrete voorbeelden: bij het Rijksmuseum is toegang t/m 18 jaar gratis. Bij Stadsarchief Amsterdam is de
          Tentoonstellingszaal gratis voor 0-18 jaar (en enkele andere groepen). Bij Ons&apos; Lieve Heer op Solder is een
          peuterticket (t/m 4 jaar) gratis.
        </p>

        <h2>Gratis of voordeliger met een pas</h2>
        <p>
          Niet alles is letterlijk gratis, maar met een pas kun je vaak veel besparen. Belangrijk: een pas kost zelf
          geld, dus dit is <strong>korting of prepaid toegang</strong>, geen universele gratis entree.
        </p>
        <ul>
          <li>
            <strong>Museumkaart</strong>: geeft volgens Museum.nl onbeperkte toegang tot meer dan 500 musea in
            Nederland.
          </li>
          <li>
            <strong>I amsterdam City Card</strong>: geeft toegang tot meer dan 70 musea en topattracties in
            Amsterdam en de Metropoolregio Amsterdam.
          </li>
          <li>
            <strong>Andere regelingen</strong>: sommige musea bieden extra kortingen met bijvoorbeeld Stadspas,
            studentenkaart of tijdelijke acties.
          </li>
        </ul>

        <h2>Tips om Amsterdamse musea goedkoper te bezoeken</h2>
        <ul>
          <li>Check altijd de officiële ticketpagina van het museum.</li>
          <li>Kijk expliciet naar kinder- en jeugdvoorwaarden.</li>
          <li>Let op gratis publieksprogramma&apos;s, open dagen en tijdelijke acties.</li>
          <li>Overweeg een pas als je meerdere musea op één trip wilt bezoeken.</li>
          <li>Vergeet kleinere culturele plekken niet; daar zijn soms laagdrempelige tarieven.</li>
        </ul>

        <p>
          Zoek je een museum dat past bij jouw dag in Amsterdam? Bekijk dan onze{' '}
          <Link href="/tentoonstellingen">tentoonstellingenpagina</Link>, ga naar het{' '}
          <Link href="/">volledige museumoverzicht</Link> of lees direct meer over{' '}
          <Link href="/museum/rijksmuseum-amsterdam">het Rijksmuseum</Link> en{' '}
          <Link href="/museum/ons-lieve-heer-op-solder-amsterdam">Ons&apos; Lieve Heer op Solder</Link>.
        </p>
      </section>

      {featuredMuseums.length ? (
        <>
          <h2 style={{ marginBottom: '1rem' }}>Uitgelichte musea om voorwaarden te vergelijken</h2>
          <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {featuredMuseums.map((museum, index) => (
              <li key={museum.slug}>
                <MuseumCard museum={museum} priority={index < 2} />
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
