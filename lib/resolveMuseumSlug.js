import FALLBACK_MUSEUMS from './museumFallbackData';
import museumImages from './museumImages';
import museumTicketUrls from './museumTicketUrls';

const KNOWN_SLUGS = new Set([
  ...Object.keys(museumImages || {}),
  ...Object.keys(museumTicketUrls || {}),
]);

const NAME_TO_SLUG = (() => {
  const map = new Map();
  (FALLBACK_MUSEUMS || []).forEach((museum) => {
    if (!museum || !museum.slug || !museum.naam) return;
    const normalizedName = normalizeName(museum.naam);
    if (!normalizedName) return;
    if (!map.has(normalizedName)) {
      map.set(normalizedName, museum.slug);
    }
  });
  return map;
})();

function normalizeName(name) {
  if (typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/&/g, 'en')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function slugify(text) {
  if (typeof text !== 'string') return '';
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/&/g, 'en')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function ensureKnownSlug(candidate) {
  if (!candidate) return null;
  const normalized = candidate.trim().toLowerCase();
  if (!normalized) return null;
  if (KNOWN_SLUGS.has(normalized)) {
    return normalized;
  }
  if (!normalized.endsWith('-amsterdam')) {
    const withCity = `${normalized}-amsterdam`;
    if (KNOWN_SLUGS.has(withCity)) {
      return withCity;
    }
  }
  return KNOWN_SLUGS.has(normalized) ? normalized : null;
}

function normaliseCandidateSlug(slug) {
  if (typeof slug !== 'string') return null;
  let candidate = slug.trim();
  if (!candidate) return null;
  candidate = candidate.replace(/^https?:\/\//, '');
  if (candidate.includes('/')) {
    const segments = candidate.split('/').filter(Boolean);
    candidate = segments[segments.length - 1];
  }
  candidate = candidate
    .normalize('NFD')
    .replace(/\p{Diacritic}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  if (!candidate) return null;

  return ensureKnownSlug(candidate) || candidate;
}

export function resolveMuseumSlug(candidateSlug, fallbackName) {
  const normalizedCandidate = normaliseCandidateSlug(candidateSlug);
  const ensuredCandidate = ensureKnownSlug(normalizedCandidate);
  if (ensuredCandidate) {
    return ensuredCandidate;
  }

  const normalizedName = normalizeName(fallbackName);
  if (normalizedName) {
    const mappedSlug = ensureKnownSlug(NAME_TO_SLUG.get(normalizedName));
    if (mappedSlug) {
      return mappedSlug;
    }

    const slugFromName = slugify(normalizedName);
    const ensuredFromName = ensureKnownSlug(slugFromName) || ensureKnownSlug(`${slugFromName}-amsterdam`);
    if (ensuredFromName) {
      return ensuredFromName;
    }
  }

  if (normalizedCandidate) {
    return normalizedCandidate;
  }

  return null;
}

export default resolveMuseumSlug;
