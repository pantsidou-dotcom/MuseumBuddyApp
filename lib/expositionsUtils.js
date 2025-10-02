export const DEFAULT_EXPOSITION_FILTERS = Object.freeze({
  free: false,
  childFriendly: false,
  temporary: false,
});

export const EXPOSITION_FILTER_QUERY_MAP = Object.freeze({
  free: 'expoGratis',
  childFriendly: 'expoKindvriendelijk',
  temporary: 'expoTijdelijk',
});

export function resolveBooleanFlag(...values) {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (!normalized) continue;
      if (['1', 'true', 'yes', 'ja', 'waar', 'y'].includes(normalized)) return true;
      if (['0', 'false', 'nee', 'no', 'n'].includes(normalized)) return false;
      return true;
    }
  }
  return undefined;
}

export function normaliseExpositionRow(row, museumSlug) {
  if (!row) return null;
  const freeFlag = resolveBooleanFlag(row.gratis, row.free, row.kosteloos, row.freeEntry);
  const childFriendlyFlag = resolveBooleanFlag(
    row.kindvriendelijk,
    row.childFriendly,
    row.familievriendelijk,
    row.familyFriendly
  );
  let temporaryFlag = resolveBooleanFlag(
    row.tijdelijk,
    row.temporary,
    row.tijdelijkeTentoonstelling,
    row.temporaryExhibition
  );
  if (temporaryFlag === undefined && row.start_datum && row.eind_datum) {
    temporaryFlag = true;
  }
  const tags = {
    free: freeFlag === true,
    childFriendly: childFriendlyFlag === true,
    temporary: temporaryFlag === true,
  };
  return {
    id: row.id,
    titel: row.titel,
    start_datum: row.start_datum,
    eind_datum: row.eind_datum,
    bron_url: row.bron_url,
    ticketAffiliateUrl: row.ticket_affiliate_url || null,
    ticketUrl: row.ticket_url || null,
    museumSlug,
    description: row.beschrijving || row.omschrijving || null,
    tags,
    free: tags.free,
    childFriendly: tags.childFriendly,
    temporary: tags.temporary,
  };
}

export function parseExpositionFiltersFromSearchParams(searchParams) {
  const filters = { ...DEFAULT_EXPOSITION_FILTERS };
  if (!searchParams) {
    return filters;
  }
  const params =
    typeof searchParams.get === 'function' ? searchParams : new URLSearchParams(String(searchParams));
  Object.entries(EXPOSITION_FILTER_QUERY_MAP).forEach(([key, param]) => {
    const value = params.get(param);
    if (value === null) return;
    if (Array.isArray(value)) {
      filters[key] = value.some((item) => parseBooleanValue(item));
      return;
    }
    filters[key] = parseBooleanValue(value);
  });
  return filters;
}

export function buildSearchParamsWithExpositionFilters(existingParams, filters) {
  const params = new URLSearchParams(existingParams ? existingParams.toString() : '');
  Object.values(EXPOSITION_FILTER_QUERY_MAP).forEach((param) => {
    params.delete(param);
  });
  Object.entries(EXPOSITION_FILTER_QUERY_MAP).forEach(([key, param]) => {
    if (filters?.[key]) {
      params.set(param, '1');
    }
  });
  return params;
}

export function hasActiveExpositionFilters(filters) {
  return Object.keys(EXPOSITION_FILTER_QUERY_MAP).some((key) => Boolean(filters?.[key]));
}

function parseBooleanValue(value) {
  if (Array.isArray(value)) {
    return value.some((item) => parseBooleanValue(item));
  }
  if (value === undefined || value === null) return false;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return true;
    if (['1', 'true', 'yes', 'ja', 'waar'].includes(normalized)) return true;
    return false;
  }
  return Boolean(value);
}
