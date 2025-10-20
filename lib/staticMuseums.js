import museumSummaries from './museumSummaries.js';
import museumOpeningHours from './museumOpeningHours.js';
import museumTicketUrls from './museumTicketUrls.js';

const BASE_CITY = 'Amsterdam';
const BASE_PROVINCE = 'Noord-Holland';

const STATIC_MUSEUM_SLUGS = [
  'allard-pierson-amsterdam',
  'amsterdam-museum-amsterdam',
  'anne-frank-huis-amsterdam',
  'body-worlds-amsterdam',
  'eye-filmmuseum-amsterdam',
  'foam-fotografiemuseum-amsterdam',
  'hart-museum-amsterdam',
  'het-grachtenmuseum-amsterdam',
  'het-schip-amsterdam',
  'huis-marseille-amsterdam',
  'joods-museum-amsterdam',
  'kattenkabinet-amsterdam',
  'micropia-museum-amsterdam',
  'moco-museum-amsterdam',
  'museum-van-loon-amsterdam',
  'nemo-science-museum-amsterdam',
  'nxt-museum-amsterdam',
  'ons-lieve-heer-op-solder-amsterdam',
  'rembrandthuis-amsterdam',
  'rijksmuseum-amsterdam',
  'scheepvaartmuseum-amsterdam',
  'stedelijk-museum-amsterdam',
  'straat-museum-amsterdam',
  'tropenmuseum-amsterdam',
  'van-gogh-museum-amsterdam',
  'wereldmuseum-amsterdam',
  'woonbootmuseum-amsterdam',
];

const STATIC_MUSEUM_NAMES = Object.freeze({
  'allard-pierson-amsterdam': 'Allard Pierson',
  'amsterdam-museum-amsterdam': 'Amsterdam Museum',
  'anne-frank-huis-amsterdam': 'Anne Frank Huis',
  'body-worlds-amsterdam': 'BODY WORLDS Amsterdam',
  'eye-filmmuseum-amsterdam': 'Eye Filmmuseum',
  'foam-fotografiemuseum-amsterdam': 'FOAM Fotografiemuseum',
  'hart-museum-amsterdam': "H'ART Museum",
  'het-grachtenmuseum-amsterdam': 'Het Grachtenmuseum',
  'het-schip-amsterdam': 'Museum Het Schip',
  'huis-marseille-amsterdam': 'Huis Marseille',
  'joods-museum-amsterdam': 'Joods Museum',
  'kattenkabinet-amsterdam': 'KattenKabinet',
  'micropia-museum-amsterdam': 'Micropia',
  'moco-museum-amsterdam': 'Moco Museum',
  'museum-van-loon-amsterdam': 'Museum Van Loon',
  'nemo-science-museum-amsterdam': 'NEMO Science Museum',
  'nxt-museum-amsterdam': 'Nxt Museum',
  'ons-lieve-heer-op-solder-amsterdam': "Ons' Lieve Heer op Solder",
  'rembrandthuis-amsterdam': 'Museum Het Rembrandthuis',
  'rijksmuseum-amsterdam': 'Rijksmuseum',
  'scheepvaartmuseum-amsterdam': 'Het Scheepvaartmuseum',
  'stedelijk-museum-amsterdam': 'Stedelijk Museum Amsterdam',
  'straat-museum-amsterdam': 'STRAAT Museum',
  'tropenmuseum-amsterdam': 'Tropenmuseum (Wereldmuseum Amsterdam)',
  'van-gogh-museum-amsterdam': 'Van Gogh Museum',
  'wereldmuseum-amsterdam': 'Wereldmuseum Amsterdam',
  'woonbootmuseum-amsterdam': 'Woonbootmuseum',
});

const STATIC_MUSEUM_WEBSITES = Object.freeze({
  'allard-pierson-amsterdam': 'https://allardpierson.nl',
  'amsterdam-museum-amsterdam': 'https://www.amsterdam-museum.nl',
  'anne-frank-huis-amsterdam': 'https://www.annefrank.org',
  'body-worlds-amsterdam': 'https://bodyworlds.nl',
  'eye-filmmuseum-amsterdam': 'https://www.eyefilm.nl',
  'foam-fotografiemuseum-amsterdam': 'https://www.foam.org',
  'hart-museum-amsterdam': 'https://hartmuseum.nl',
  'het-grachtenmuseum-amsterdam': 'https://grachten.museum',
  'het-schip-amsterdam': 'https://www.hetschip.nl',
  'huis-marseille-amsterdam': 'https://www.huismarseille.nl',
  'joods-museum-amsterdam': 'https://www.jck.nl',
  'kattenkabinet-amsterdam': 'https://www.kattenkabinet.nl',
  'micropia-museum-amsterdam': 'https://www.micropia.nl',
  'moco-museum-amsterdam': 'https://mocomuseum.com',
  'museum-van-loon-amsterdam': 'https://www.museumvanloon.nl',
  'nemo-science-museum-amsterdam': 'https://www.nemosciencemuseum.nl',
  'nxt-museum-amsterdam': 'https://nxtmuseum.com',
  'ons-lieve-heer-op-solder-amsterdam': 'https://www.opsolder.nl',
  'rembrandthuis-amsterdam': 'https://www.rembrandthuis.nl',
  'rijksmuseum-amsterdam': 'https://www.rijksmuseum.nl',
  'scheepvaartmuseum-amsterdam': 'https://www.hetscheepvaartmuseum.nl',
  'stedelijk-museum-amsterdam': 'https://www.stedelijk.nl',
  'straat-museum-amsterdam': 'https://straatmuseum.com',
  'tropenmuseum-amsterdam': 'https://www.wereldmuseum.nl/nl/locatie/amsterdam',
  'van-gogh-museum-amsterdam': 'https://www.vangoghmuseum.nl',
  'wereldmuseum-amsterdam': 'https://www.wereldmuseum.nl/nl/locatie/amsterdam',
  'woonbootmuseum-amsterdam': 'https://www.woonbootmuseum.nl',
});

function toTitleCase(value) {
  if (!value) return '';
  return value
    .split('-')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

const STATIC_MUSEUMS = STATIC_MUSEUM_SLUGS.map((slug, index) => {
  const summary = museumSummaries[slug] || null;
  const openingHours = museumOpeningHours[slug] || null;
  return {
    id: `static-${index + 1}`,
    slug,
    naam: STATIC_MUSEUM_NAMES[slug] || toTitleCase(slug),
    stad: BASE_CITY,
    provincie: BASE_PROVINCE,
    gratis_toegankelijk: false,
    ticket_affiliate_url: museumTicketUrls[slug] || null,
    website_url: STATIC_MUSEUM_WEBSITES[slug] || null,
    samenvatting: summary?.nl || summary?.en || null,
    korte_beschrijving: summary?.en || summary?.nl || null,
    beschrijving: summary?.nl || summary?.en || null,
    openingstijden: openingHours?.nl || openingHours?.en || null,
  };
});

export function getStaticMuseums() {
  return STATIC_MUSEUMS.slice();
}

export function getStaticMuseumBySlug(slug) {
  if (!slug) return null;
  const normalized = String(slug).toLowerCase();
  return STATIC_MUSEUMS.find((museum) => museum.slug === normalized) || null;
}

export default STATIC_MUSEUMS;
