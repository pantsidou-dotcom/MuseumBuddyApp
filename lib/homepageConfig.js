export const FEATURED_SLUGS = [
  'van-gogh-museum-amsterdam',
  'rijksmuseum-amsterdam',
  'anne-frank-huis-amsterdam',
  'stedelijk-museum-amsterdam',
  'moco-museum-amsterdam',
  'scheepvaartmuseum-amsterdam',
  'nemo-science-museum-amsterdam',
  'hart-museum-amsterdam',
  'rembrandthuis-amsterdam',
];

export function sortMuseums(museums) {
  return [...(museums || [])].sort((a, b) => {
    const aIndex = FEATURED_SLUGS.indexOf(a.slug);
    const bIndex = FEATURED_SLUGS.indexOf(b.slug);
    const aFeatured = aIndex !== -1;
    const bFeatured = bIndex !== -1;
    if (aFeatured || bFeatured) {
      if (aFeatured && bFeatured) return aIndex - bIndex;
      return aFeatured ? -1 : 1;
    }
    const nameA = a.naam || a.name || '';
    const nameB = b.naam || b.name || '';
    return nameA.localeCompare(nameB);
  });
}

export function sortMuseumsByDistance(museums) {
  return [...(museums || [])].sort((a, b) => {
    const aDistance = typeof a?.afstand_meter === 'number' ? a.afstand_meter : Number.POSITIVE_INFINITY;
    const bDistance = typeof b?.afstand_meter === 'number' ? b.afstand_meter : Number.POSITIVE_INFINITY;

    if (aDistance === bDistance) {
      const nameA = a.naam || a.name || '';
      const nameB = b.naam || b.name || '';
      return nameA.localeCompare(nameB);
    }

    return aDistance - bDistance;
  });
}

export function todayYMD(tz = 'Europe/Amsterdam') {
  try {
    const fmt = new Intl.DateTimeFormat('sv-SE', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(new Date());
  } catch (err) {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}

export const FILTERS_EVENT = 'museumBuddy:openFilters';

export const DEFAULT_FILTERS = Object.freeze({
  free: false,
  exhibitions: false,
  kidFriendly: false,
  nearby: false,
  date: 'today',
  openNow: false,
});

export const BASE_MUSEUM_COLUMNS =
  'id, naam, stad, provincie, slug, gratis_toegankelijk, ticket_affiliate_url, website_url, openingstijden, opening_hours';
export const OPTIONAL_MUSEUM_COLUMNS = 'kindvriendelijk, afstand_meter';
export const NEARBY_RPC_NAME = 'musea_within_radius';
export const NEARBY_RADIUS_METERS = 5000;
