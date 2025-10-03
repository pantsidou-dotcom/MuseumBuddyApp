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

function resolveFirstValue(row, keys) {
  if (!row || !Array.isArray(keys)) return undefined;
  for (const key of keys) {
    if (!key) continue;
    if (Object.prototype.hasOwnProperty.call(row, key)) {
      const value = row[key];
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }
  return undefined;
}

function resolveDateString(row, keys) {
  const value = resolveFirstValue(row, keys);
  if (!value) return undefined;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }
  return undefined;
}

export function normaliseExpositionRow(row, fallbackMuseumSlug) {
  if (!row) return null;

  const id = resolveFirstValue(row, ['id', 'expo_id', 'exposition_id']);
  const title = resolveFirstValue(row, ['titel', 'title', 'naam', 'name']);
  if (!id || !title) {
    return null;
  }

  const startDate = resolveDateString(row, ['start_datum', 'startDatum', 'start_date', 'start']);
  const endDate = resolveDateString(row, ['eind_datum', 'eindDatum', 'end_date', 'end']);
  const description = resolveFirstValue(row, ['beschrijving', 'omschrijving', 'description', 'samenvatting']);
  const sourceUrl = resolveFirstValue(row, ['bron_url', 'bronUrl', 'source_url', 'sourceUrl']);
  const ticketAffiliateUrl = resolveFirstValue(row, [
    'ticket_affiliate_url',
    'ticketAffiliateUrl',
    'ticket_affiliate',
  ]);
  const ticketUrl = resolveFirstValue(row, ['ticket_url', 'ticketUrl', 'tickets_url']);
  const museumSlug = resolveFirstValue(row, [
    'museum_slug',
    'museumSlug',
    'slug',
    'museum_slug_current',
  ]) || fallbackMuseumSlug || null;

  const museumImage = resolveFirstValue(row, [
    'museum_afbeelding_url',
    'museum_afbeelding',
    'museumImageUrl',
    'museumImage',
    'afbeelding_url',
    'afbeeldingUrl',
    'image_url',
    'imageUrl',
    'image',
  ]);
  const museumImageCreditRaw = resolveFirstValue(row, [
    'museum_afbeelding_credit',
    'museumImageCredit',
    'image_credit',
    'imageCredit',
    'fotocredit',
    'foto_credit',
    'credit',
  ]);
  let museumImageCredit = null;
  if (typeof museumImageCreditRaw === 'string') {
    const trimmed = museumImageCreditRaw.trim();
    if (trimmed) {
      museumImageCredit = { text: trimmed };
    }
  } else if (museumImageCreditRaw && typeof museumImageCreditRaw === 'object') {
    museumImageCredit = museumImageCreditRaw;
  }

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
  if (temporaryFlag === undefined && startDate && endDate) {
    temporaryFlag = true;
  }

  const tags = {
    free: freeFlag === true,
    childFriendly: childFriendlyFlag === true,
    temporary: temporaryFlag === true,
  };

  return {
    id,
    titel: title,
    start_datum: startDate || null,
    eind_datum: endDate || null,
    bron_url: sourceUrl || null,
    ticketAffiliateUrl: ticketAffiliateUrl || null,
    ticketUrl: ticketUrl || null,
    museumSlug,
    description: description || null,
    tags,
    free: tags.free,
    childFriendly: tags.childFriendly,
    temporary: tags.temporary,
    museumImage: museumImage || null,
    museumImageCredit,
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
