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

const STATIC_EXHIBITIONS_SOURCE = [];

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
