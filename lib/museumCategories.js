import museumSummaries from './museumSummaries';

export const CATEGORY_FILTERS = [
  { key: 'science', labelKey: 'filterScience' },
  { key: 'history', labelKey: 'filterHistory' },
  { key: 'art', labelKey: 'filterArt' },
  { key: 'family', labelKey: 'filterFamily' },
  { key: 'modern', labelKey: 'filterModern' },
];

const MANUAL_CATEGORIES = {
  'allard-pierson-amsterdam': ['history', 'science'],
  'amsterdam-museum-amsterdam': ['history'],
  'anne-frank-huis-amsterdam': ['history'],
  'body-worlds-amsterdam': ['science', 'family'],
  'eye-filmmuseum-amsterdam': ['modern'],
  'foam-fotografiemuseum-amsterdam': ['art', 'modern'],
  'hart-museum-amsterdam': ['art', 'history'],
  'het-grachtenmuseum-amsterdam': ['history'],
  'het-schip-amsterdam': ['history'],
  'huis-marseille-amsterdam': ['art', 'modern'],
  'joods-museum-amsterdam': ['history'],
  'kattenkabinet-amsterdam': ['art', 'family'],
  'micropia-museum-amsterdam': ['science', 'family'],
  'moco-museum-amsterdam': ['art', 'modern'],
  'museum-van-loon-amsterdam': ['history'],
  'nemo-science-museum-amsterdam': ['science', 'family'],
  'nxt-museum-amsterdam': ['art', 'modern'],
  'ons-lieve-heer-op-solder-amsterdam': ['history'],
  'rembrandthuis-amsterdam': ['art', 'history'],
  'rijksmuseum-amsterdam': ['art', 'history'],
  'scheepvaartmuseum-amsterdam': ['history', 'science', 'family'],
  'stedelijk-museum-amsterdam': ['art', 'modern'],
  'straat-museum-amsterdam': ['art', 'modern'],
  'tropenmuseum-amsterdam': ['history', 'family'],
  'van-gogh-museum-amsterdam': ['art'],
  'wereldmuseum-amsterdam': ['history', 'art'],
  'woonbootmuseum-amsterdam': ['history', 'family'],
};

const KEYWORD_RULES = [
  {
    category: 'science',
    tests: [
      /science/,
      /techniek/,
      /technolog/,
      /wetenschap/,
      /natuur/,
      /nature/,
      /planetarium/,
      /ruimte/,
      /space/,
      /geolog/,
      /astronom/,
      /sterrewacht/,
      /maritiem/,
      /scheepvaart/,
      /aviati/,
      /luchtvaart/,
      /anatom/,
      /biolog/,
      /microb/,
      /lab/,
      /experiment/,
      /discovery/,
      /innov/,
      /energie/,
      /energy/,
      /zoo/,
      /aquarium/,
    ],
  },
  {
    category: 'history',
    tests: [
      /history/,
      /histor/,
      /erfgoed/,
      /heritage/,
      /oorlog/,
      /war/,
      /monument/,
      /castle/,
      /kasteel/,
      /fort/,
      /archeolog/,
      /canal/,
      /grachten/,
      /17th-century/,
      /story/,
      /culture/,
      /verhalen/,
      /wereldculturen/,
      /joods/,
      /jewish/,
      /rembrandt/,
      /anne[-\s]?frank/,
      /woonboot/,
    ],
  },
  {
    category: 'art',
    tests: [
      /\bart\b/,
      /kunst/,
      /kunstenaar/,
      /kunstmuseum/,
      /galer/,
      /painter/,
      /schilder/,
      /atelier/,
      /beeld/,
      /sculpt/,
      /fotograf/,
      /photo/,
      /mode/,
      /fashion/,
      /design/,
      /street art/,
    ],
  },
  {
    category: 'family',
    tests: [
      /family/,
      /familie/,
      /kind/,
      /children/,
      /kids/,
      /speel/,
      /interactive/,
      /hands-on/,
      /doe-/,
      /beleving/,
      /experience/,
      /adventure/,
      /story/,
    ],
  },
  {
    category: 'modern',
    tests: [
      /modern/,
      /hedendaags/,
      /contemporary/,
      /digital/,
      /media/,
      /immersive/,
      /graffiti/,
      /street art/,
      /design/,
      /fotograf/,
      /photo/,
      /film/,
      /cinema/,
      /architect/,
    ],
  },
];

const ORDER = CATEGORY_FILTERS.map((item) => item.key);

export default function getMuseumCategories(slug) {
  if (!slug) return [];

  const categories = new Set(MANUAL_CATEGORIES[slug] || []);
  const summary = museumSummaries[slug];
  const haystack = `${slug} ${(summary?.en || '')} ${(summary?.nl || '')}`.toLowerCase();

  KEYWORD_RULES.forEach(({ category, tests }) => {
    if (categories.has(category)) return;
    if (tests.some((test) => test.test(haystack))) {
      categories.add(category);
    }
  });

  return Array.from(categories).sort((a, b) => {
    const aIndex = ORDER.indexOf(a);
    const bIndex = ORDER.indexOf(b);
    if (aIndex === -1 && bIndex === -1) {
      return a.localeCompare(b);
    }
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

