export function filterMuseumsForDisplay(
  museums,
  { excludeSlugs = [], onlyKidFriendly = false, isKidFriendlyCheck, isNearbyActive = false } = {}
) {
  const list = Array.isArray(museums) ? museums.filter(Boolean) : [];
  const exclusions = Array.isArray(excludeSlugs)
    ? excludeSlugs.filter(Boolean)
    : excludeSlugs
    ? [excludeSlugs]
    : [];
  const exclusionSet = new Set(exclusions);

  let filtered = list;

  if (exclusionSet.size > 0) {
    filtered = filtered.filter((museum) => !exclusionSet.has(museum?.slug));
  }

  if (onlyKidFriendly && typeof isKidFriendlyCheck === 'function') {
    filtered = filtered.filter((museum) => isKidFriendlyCheck(museum));
  }

  // When the nearby filter is active we intentionally keep all results, even when
  // `afstand_meter` is null, because the RPC already limits the rows to the
  // requested radius. This also ensures we show the calculated distances that
  // come back from the server.
  if (isNearbyActive) {
    return filtered;
  }

  return filtered;
}
