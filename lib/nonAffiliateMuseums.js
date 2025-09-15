const NON_AFFILIATE_MUSEUM_SLUGS = new Set([
  'anne-frank-huis-amsterdam',
  'eye-filmmuseum-amsterdam',
  'het-grachtenmuseum-amsterdam',
  'huis-marseille-amsterdam',
]);

export function shouldShowAffiliateNote(slug) {
  if (!slug) return true;
  return !NON_AFFILIATE_MUSEUM_SLUGS.has(slug);
}

export default NON_AFFILIATE_MUSEUM_SLUGS;
