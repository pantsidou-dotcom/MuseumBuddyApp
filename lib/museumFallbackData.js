import museumOpeningHours from './museumOpeningHours';

const BASE_FALLBACK_MUSEUMS = [
  { slug: 'van-gogh-museum-amsterdam', naam: 'Van Gogh Museum' },
  { slug: 'rijksmuseum-amsterdam', naam: 'Rijksmuseum' },
  { slug: 'anne-frank-huis-amsterdam', naam: 'Anne Frank Huis' },
  { slug: 'stedelijk-museum-amsterdam', naam: 'Stedelijk Museum' },
  { slug: 'moco-museum-amsterdam', naam: 'Moco Museum' },
  { slug: 'scheepvaartmuseum-amsterdam', naam: 'Het Scheepvaartmuseum' },
  { slug: 'nemo-science-museum-amsterdam', naam: 'NEMO Science Museum' },
  { slug: 'hart-museum-amsterdam', naam: "H'ART Museum" },
  { slug: 'rembrandthuis-amsterdam', naam: 'Museum Het Rembrandthuis' },
  { slug: 'allard-pierson-amsterdam', naam: 'Allard Pierson Museum' },
  { slug: 'amsterdam-museum-amsterdam', naam: 'Amsterdam Museum' },
  { slug: 'body-worlds-amsterdam', naam: 'BODY WORLDS Amsterdam' },
  { slug: 'eye-filmmuseum-amsterdam', naam: 'Eye Filmmuseum' },
  { slug: 'foam-fotografiemuseum-amsterdam', naam: 'Foam Fotografiemuseum' },
  { slug: 'het-grachtenmuseum-amsterdam', naam: 'Museum Het Grachtenhuis' },
  { slug: 'het-schip-amsterdam', naam: 'Museum Het Schip' },
  { slug: 'huis-marseille-amsterdam', naam: 'Huis Marseille' },
  { slug: 'joods-museum-amsterdam', naam: 'Joods Museum' },
  { slug: 'kattenkabinet-amsterdam', naam: 'KattenKabinet' },
  { slug: 'micropia-museum-amsterdam', naam: 'Micropia' },
  { slug: 'museum-van-loon-amsterdam', naam: 'Museum Van Loon' },
  { slug: 'nxt-museum-amsterdam', naam: 'Nxt Museum' },
  { slug: 'ons-lieve-heer-op-solder-amsterdam', naam: "Ons' Lieve Heer op Solder" },
  { slug: 'straat-museum-amsterdam', naam: 'STRAAT Museum' },
  { slug: 'wereldmuseum-amsterdam', naam: 'Wereldmuseum Amsterdam' },
  { slug: 'woonbootmuseum-amsterdam', naam: 'Woonbootmuseum' },
];

const FALLBACK_MUSEUMS = BASE_FALLBACK_MUSEUMS.map((museum, index) => {
  const hours = museumOpeningHours[museum.slug] || {};
  return {
    id: index + 1,
    slug: museum.slug,
    naam: museum.naam,
    stad: museum.stad || 'Amsterdam',
    provincie: museum.provincie || 'Noord-Holland',
    gratis_toegankelijk: Boolean(museum.gratis_toegankelijk),
    ticket_affiliate_url: museum.ticket_affiliate_url || null,
    website_url: museum.website_url || null,
    openingstijden: museum.openingstijden || hours.nl || null,
    opening_hours: museum.opening_hours || hours.en || hours.nl || null,
    has_active_exhibitions:
      museum.has_active_exhibitions === undefined ? true : museum.has_active_exhibitions,
  };
});

export default FALLBACK_MUSEUMS;
