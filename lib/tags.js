const TAG_SYNONYMS = {
  kindvriendelijk: [
    'kindvriendelijk',
    'kind-vriendelijk',
    'kidfriendly',
    'kid-friendly',
    'childfriendly',
    'child-friendly',
    'familievriendelijk',
    'familyfriendly',
    'family-friendly',
  ],
  gratis: ['gratis', 'free', 'kosteloos', 'kosteloos toegang', 'gratis toegang'],
  tijdelijk: ['tijdelijk', 'tijdelijke', 'temporary', 'temporary exhibition', 'tijdelijke tentoonstelling'],
  modern: [
    'modern',
    'moderne',
    'modern art',
    'moderne kunst',
    'hedendaags',
    'hedendaagse',
    'hedendaagse kunst',
    'contemporary',
    'contemporary art',
    'contemporary-art',
  ],
};

const NORMALIZED_SYNONYMS = Object.entries(TAG_SYNONYMS).reduce((acc, [canonical, synonyms]) => {
  synonyms.forEach((synonym) => {
    if (typeof synonym !== 'string') return;
    const normalized = synonym.trim().toLowerCase();
    if (!normalized) return;
    acc[normalized] = canonical;
  });
  return acc;
}, {});

export function normalizeTagName(tag) {
  if (typeof tag !== 'string') return null;
  const normalized = tag.trim().toLowerCase();
  if (!normalized) return null;
  return NORMALIZED_SYNONYMS[normalized] || normalized;
}

export function normalizeTagList(tags) {
  const list = Array.isArray(tags) ? tags : [tags];
  const result = new Set();
  list.forEach((tag) => {
    const canonical = normalizeTagName(tag);
    if (canonical) {
      result.add(canonical);
    }
  });
  return Array.from(result);
}

export function parseTagsParam(value) {
  if (Array.isArray(value)) {
    return normalizeTagList(
      value
        .join(',')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  if (typeof value === 'string') {
    return normalizeTagList(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    );
  }

  return [];
}

export function serializeTags(tags) {
  const normalized = normalizeTagList(tags);
  if (!normalized.length) return undefined;
  return normalized.sort().join(',');
}

export const TAGS = Object.freeze({
  KIND_FRIENDLY: 'kindvriendelijk',
  FREE: 'gratis',
  TEMPORARY: 'tijdelijk',
  MODERN: 'modern',
});

export function createTagFlagMap(tags) {
  const normalized = normalizeTagList(tags);
  return normalized.reduce((acc, tag) => {
    acc[tag] = true;
    return acc;
  }, {});
}
