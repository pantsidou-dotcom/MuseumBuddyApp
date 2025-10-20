import museumNames from './museumNames.js';
import museumImages from './museumImages.js';
import museumImageCredits from './museumImageCredits.js';
import museumTicketUrls from './museumTicketUrls.js';
import { getStaticMuseumBySlug } from './staticMuseums.js';

function createMuseumForSlug(slug) {
  if (!slug) {
    return null;
  }

  const staticMuseum = getStaticMuseumBySlug(slug);

  if (staticMuseum) {
    const {
      id,
      naam,
      stad,
      provincie,
      gratis_toegankelijk,
      ticket_affiliate_url,
      website_url,
      afbeelding_url,
      image_url,
    } = staticMuseum;

    return {
      id,
      slug,
      naam,
      stad,
      provincie,
      gratis_toegankelijk: Boolean(gratis_toegankelijk),
      ticket_affiliate_url: ticket_affiliate_url || null,
      website_url: website_url || null,
      afbeelding_url: afbeelding_url || museumImages[slug] || null,
      image_url: image_url || museumImages[slug] || null,
      imageCredit: museumImageCredits[slug] || null,
    };
  }

  return {
    id: slug,
    slug,
    naam: museumNames[slug] || slug,
    stad: 'Amsterdam',
    provincie: 'Noord-Holland',
    gratis_toegankelijk: false,
    ticket_affiliate_url: museumTicketUrls[slug] || null,
    website_url: null,
    afbeelding_url: museumImages[slug] || null,
    image_url: museumImages[slug] || null,
    imageCredit: museumImageCredits[slug] || null,
  };
}

const STATIC_EXHIBITIONS_SOURCE = [
  {
    id: 'static-exhibition-van-gogh-paris-2024',
    museumSlug: 'van-gogh-museum-amsterdam',
    titel: 'Van Gogh in Parijs',
    start_datum: '2024-03-01',
    eind_datum: '2024-09-01',
    beschrijving:
      'Verdiep je in de Parijse jaren van Vincent van Gogh met schilderijen, tekeningen en brieven die laten zien hoe de stad zijn werk veranderde.',
    description:
      'Explore Vincent van Gogh\'s transformative Paris years through paintings, drawings and letters that reveal how the city reshaped his art.',
    ticket_url:
      'https://www.vangoghmuseum.nl/nl/zien-en-doen/tentoonstellingen/van-gogh-in-parijs',
    bron_url:
      'https://www.vangoghmuseum.nl/nl/bezoek/agenda',
  },
  {
    id: 'static-exhibition-rijksmuseum-rijks-2024',
    museumSlug: 'rijksmuseum-amsterdam',
    titel: 'Vermeer Highlights',
    start_datum: '2024-02-15',
    eind_datum: '2024-12-31',
    beschrijving:
      'Een intieme selectie van Johannes Vermeers meesterwerken, aangevuld met röntgenbeelden en schetsen die nieuwe inzichten geven in zijn techniek.',
    description:
      'An intimate presentation of Johannes Vermeer\'s masterpieces, paired with X-rays and sketches that uncover new insights into his technique.',
    ticket_url: 'https://www.rijksmuseum.nl/nl/tentoonstellingen',
    bron_url: 'https://www.rijksmuseum.nl/nl/tickets/artikel',
  },
  {
    id: 'static-exhibition-stedelijk-futures-2024',
    museumSlug: 'stedelijk-museum-amsterdam',
    titel: 'Futures of Form',
    start_datum: '2024-04-20',
    eind_datum: '2024-10-20',
    beschrijving:
      'Ontdek experimentele installaties, design en nieuwe media die speculeren over de toekomst van stedelijk leven en vormgeving.',
    description:
      'Discover experimental installations, design and new media works that speculate on the future of urban life and design.',
    ticket_url: 'https://www.stedelijk.nl/nl/tentoonstellingen',
    bron_url: 'https://www.stedelijk.nl/nl/bezoek',
  },
  {
    id: 'static-exhibition-straat-graffiti-2024',
    museumSlug: 'straat-museum-amsterdam',
    titel: 'Graffiti Masters',
    start_datum: '2024-01-10',
    eind_datum: '2024-08-31',
    beschrijving:
      'Internationale street art-pioniers vullen de loodsen van STRAAT met kleurrijke muurschilderingen, sculpturen en multimediawerken.',
    description:
      'International street art pioneers take over STRAAT\'s warehouses with vibrant murals, sculptures and multimedia works.',
    ticket_url: 'https://straatmuseum.com/nl/tentoonstellingen',
    bron_url: 'https://straatmuseum.com/nl/bezoek',
  },
];

const STATIC_EXHIBITIONS = STATIC_EXHIBITIONS_SOURCE.map((entry) => {
  const museum = createMuseumForSlug(entry.museumSlug);
  const fallbackTitle = museumNames[entry.museumSlug] || museum?.naam || entry.titel;

  return {
    id: entry.id,
    titel: entry.titel || fallbackTitle,
    start_datum: entry.start_datum || null,
    eind_datum: entry.eind_datum || null,
    beschrijving: entry.beschrijving || entry.description || null,
    omschrijving: entry.description || entry.beschrijving || null,
    description: entry.description || entry.beschrijving || null,
    gratis: null,
    free: null,
    kosteloos: null,
    freeEntry: null,
    isFree: null,
    is_free: null,
    ticket_affiliate_url: museumTicketUrls[entry.museumSlug] || null,
    ticket_url: entry.ticket_url || museum?.website_url || null,
    bron_url: entry.bron_url || entry.ticket_url || museum?.website_url || null,
    afbeelding_url: entry.afbeelding_url || museum?.afbeelding_url || null,
    image_url: entry.image_url || museum?.image_url || null,
    museum,
  };
});

export function getStaticExhibitions() {
  return STATIC_EXHIBITIONS.map((exhibition) => ({
    ...exhibition,
    museum: exhibition.museum ? { ...exhibition.museum } : null,
  }));
}

export default STATIC_EXHIBITIONS;
