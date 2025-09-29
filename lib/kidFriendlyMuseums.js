const kidFriendlyMuseums = Object.freeze([
  'nemo-science-museum-amsterdam',
  'micropia-museum-amsterdam',
]);

const TRUTHY_STRINGS = new Set(['1', 'true', 'yes', 'ja', 'waar', 'y']);
const FALSY_STRINGS = new Set(['0', 'false', 'nee', 'no', 'n']);
const defaultSlugSet = new Set(kidFriendlyMuseums.map((slug) => slug.toLowerCase()));

function normalizeBoolean(value) {
  if (value === undefined || value === null) return false;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return false;
    if (TRUTHY_STRINGS.has(normalized)) return true;
    if (FALSY_STRINGS.has(normalized)) return false;
  }
  return Boolean(value);
}

export function isKidFriendly(museum, slugSet = defaultSlugSet) {
  if (!museum) return false;

  const slugCandidate =
    typeof museum === 'string'
      ? museum
      : museum.slug || museum.slugId || museum.slug_id || museum.raw?.slug || null;

  const normalizedSlug = typeof slugCandidate === 'string' ? slugCandidate.trim().toLowerCase() : '';

  if (normalizedSlug && slugSet && typeof slugSet.has === 'function' && slugSet.has(normalizedSlug)) {
    return true;
  }

  if (typeof museum !== 'object' || museum === null) {
    return false;
  }

  const candidates = [
    museum.kidFriendly,
    museum.kindvriendelijk,
    museum.childFriendly,
    museum.familievriendelijk,
    museum.familyFriendly,
    museum.tags?.kidFriendly,
    museum.tags?.childFriendly,
    museum.raw?.kidFriendly,
    museum.raw?.kindvriendelijk,
    museum.raw?.childFriendly,
    museum.raw?.familievriendelijk,
    museum.raw?.familyFriendly,
  ];

  return candidates.some((value) => normalizeBoolean(value));
}

export default kidFriendlyMuseums;
