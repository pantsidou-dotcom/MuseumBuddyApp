const museumCategories = {
  'allard-pierson-amsterdam': ['history'],
  'amsterdam-museum-amsterdam': ['history'],
  'anne-frank-huis-amsterdam': ['history'],
  'body-worlds-amsterdam': ['science'],
  'eye-filmmuseum-amsterdam': ['art', 'film'],
  'foam-fotografiemuseum-amsterdam': ['art', 'photography'],
  'hart-museum-amsterdam': ['science'],
  'het-grachtenmuseum-amsterdam': ['history', 'architecture'],
  'het-schip-amsterdam': ['history', 'architecture'],
  'huis-marseille-amsterdam': ['art', 'photography'],
  'joods-museum-amsterdam': ['history', 'culture', 'religion'],
  'kattenkabinet-amsterdam': ['art'],
  'micropia-museum-amsterdam': ['science'],
  'moco-museum-amsterdam': ['art', 'modern-art'],
  'museum-van-loon-amsterdam': ['history'],
  'nemo-science-museum-amsterdam': ['science'],
  'nxt-museum-amsterdam': ['art', 'modern-art'],
  'ons-lieve-heer-op-solder-amsterdam': ['history', 'religion'],
  'rembrandthuis-amsterdam': ['art', 'history'],
  'rijksmuseum-amsterdam': ['art', 'history'],
  'scheepvaartmuseum-amsterdam': ['history', 'maritime'],
  'stedelijk-museum-amsterdam': ['art', 'modern-art'],
  'straat-museum-amsterdam': ['art', 'modern-art'],
  'tropenmuseum-amsterdam': ['history', 'culture'],
  'van-gogh-museum-amsterdam': ['art'],
  'wereldmuseum-amsterdam': ['history', 'culture'],
  'woonbootmuseum-amsterdam': ['history', 'maritime'],
};

export const CATEGORY_ORDER = [
  'exhibition',
  'science',
  'history',
  'art',
  'modern-art',
  'photography',
  'architecture',
  'maritime',
  'culture',
  'religion',
  'film',
];

export const CATEGORY_TRANSLATION_KEYS = {
  science: 'categoryScience',
  history: 'categoryHistory',
  art: 'categoryArt',
  'modern-art': 'categoryModernArt',
  photography: 'categoryPhotography',
  architecture: 'categoryArchitecture',
  maritime: 'categoryMaritime',
  culture: 'categoryCulture',
  religion: 'categoryReligion',
  film: 'categoryFilm',
};

export function getMuseumCategories(slug) {
  if (!slug) return [];
  const categories = museumCategories[String(slug).toLowerCase()];
  if (!categories) return [];
  return categories.slice();
}

export default museumCategories;
