import { CATEGORY_ORDER } from './museumCategories.js';

const CATEGORY_SYNONYMS = {
  science: [
    'science',
    'scientific',
    'wetenschap',
    'wetenschappelijk',
    'wetenschappen',
    'technology',
    'technologie',
    'tech',
    'biologie',
    'natuurwetenschap',
    'natuurwetenschappen',
  ],
  history: ['history', 'historic', 'historical', 'geschiedenis', 'historisch', 'erfgoed', 'heritage'],
  art: ['art', 'arts', 'kunst', 'fine art', 'klassieke kunst', 'schilderkunst'],
  'modern-art': [
    'modern art',
    'modern-art',
    'moderne kunst',
    'moderne-kunst',
    'contemporary art',
    'hedendaagse kunst',
    'digital art',
    'digitale kunst',
    'street art',
    'straatkunst',
  ],
  photography: [
    'photography',
    'photograph',
    'photographs',
    'photo',
    'photos',
    'fotografie',
    'foto',
    'fotomuseum',
  ],
  architecture: ['architecture', 'architectuur', 'architectural', 'bouwkunst'],
  maritime: ['maritime', 'scheepvaart', 'zeevaart', 'shipping', 'naval'],
  culture: [
    'culture',
    'cultuur',
    'world cultures',
    'wereldculturen',
    'ethnography',
    'ethnographic',
    'ethnografisch',
    'ethnografische',
  ],
  religion: ['religion', 'religie', 'church', 'kerk', 'faith', 'geloof'],
  film: ['film', 'films', 'cinema', 'movie', 'movies', 'bioscoop'],
};

const SORTED_CATEGORY_SYNONYMS = Object.entries(CATEGORY_SYNONYMS)
  .flatMap(([category, synonyms]) =>
    synonyms
      .map((synonym) => (typeof synonym === 'string' ? synonym.trim() : ''))
      .filter(Boolean)
      .map((synonym) => ({ category, synonym }))
  )
  .sort((a, b) => {
    if (b.synonym.length === a.synonym.length) {
      return a.synonym.localeCompare(b.synonym);
    }
    return b.synonym.length - a.synonym.length;
  });

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function parseMuseumSearchQuery(rawQuery) {
  if (typeof rawQuery !== 'string') {
    return { textQuery: '', categoryFilters: [] };
  }

  let working = rawQuery;
  let workingLower = rawQuery.toLowerCase();
  const matchedCategories = new Set();

  SORTED_CATEGORY_SYNONYMS.forEach(({ category, synonym }) => {
    const term = synonym.toLowerCase();
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
    if (pattern.test(workingLower)) {
      matchedCategories.add(category);
      const replacePattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, 'gi');
      working = working.replace(replacePattern, ' ');
      workingLower = workingLower.replace(replacePattern, ' ');
    }
  });

  const textQuery = working.replace(/\s+/g, ' ').trim();
  const categoryFilters = Array.from(matchedCategories);

  categoryFilters.sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a);
    const bIndex = CATEGORY_ORDER.indexOf(b);
    const safeA = aIndex === -1 ? Number.POSITIVE_INFINITY : aIndex;
    const safeB = bIndex === -1 ? Number.POSITIVE_INFINITY : bIndex;
    if (safeA === safeB) return a.localeCompare(b);
    return safeA - safeB;
  });

  return { textQuery, categoryFilters };
}

export { CATEGORY_SYNONYMS };
