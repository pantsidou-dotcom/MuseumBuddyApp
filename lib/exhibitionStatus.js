export const DUTCH_TIME_ZONE = 'Europe/Amsterdam';

export const DATE_STATUSES = Object.freeze({
  SCHEDULED: 'scheduled',
  CURRENT: 'current',
  ENDED: 'ended',
  PERMANENT: 'permanent',
  UNKNOWN: 'unknown',
});

export const VALID_VERIFICATION_STATUSES = new Set(['verified', 'manual_verified', 'source_verified']);

function ymdInTimeZone(date = new Date(), timeZone = DUTCH_TIME_ZONE) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function normalizeDateValue(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

function compareYmd(a, b) {
  if (!a || !b) return null;
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

export function hasValidVerificationStatus(status) {
  return VALID_VERIFICATION_STATUSES.has(String(status || '').trim().toLowerCase());
}

export function normalizeExhibitionDates(row = {}, options = {}) {
  const today = options.today || ymdInTimeZone(options.now || new Date(), options.timeZone || DUTCH_TIME_ZONE);
  const startDate = normalizeDateValue(row.start_date || row.start_datum || row.startDatum || row.startDate);
  const endDate = normalizeDateValue(row.end_date || row.eind_datum || row.eindDatum || row.endDate);
  const isPermanent = row.is_permanent === true || row.isPermanent === true;
  const verificationStatus = row.verification_status || row.verificationStatus || null;
  const suppliedDateStatus = String(row.date_status || row.dateStatus || '').trim().toLowerCase();
  let dateStatus = Object.values(DATE_STATUSES).includes(suppliedDateStatus)
    ? suppliedDateStatus
    : DATE_STATUSES.UNKNOWN;

  if (isPermanent) {
    dateStatus = DATE_STATUSES.PERMANENT;
  } else if (endDate && compareYmd(endDate, today) < 0) {
    dateStatus = DATE_STATUSES.ENDED;
  } else if (startDate && compareYmd(startDate, today) > 0) {
    dateStatus = DATE_STATUSES.SCHEDULED;
  } else if (endDate) {
    dateStatus = DATE_STATUSES.CURRENT;
  } else if (hasValidVerificationStatus(verificationStatus)) {
    dateStatus = DATE_STATUSES.CURRENT;
  }

  return {
    start_date: startDate,
    end_date: endDate,
    is_permanent: isPermanent,
    date_status: dateStatus,
    source_url: row.source_url || row.sourceUrl || row.bron_url || null,
    source_last_checked_at: row.source_last_checked_at || row.sourceLastCheckedAt || null,
    content_last_verified_at: row.content_last_verified_at || row.contentLastVerifiedAt || null,
    archived_at: row.archived_at || row.archivedAt || null,
    verification_status: verificationStatus,
  };
}

export function shouldShowAsCurrent(row = {}, options = {}) {
  const normalized = normalizeExhibitionDates(row, options);
  if (normalized.date_status === DATE_STATUSES.ENDED || normalized.date_status === DATE_STATUSES.UNKNOWN) return false;
  if (normalized.date_status === DATE_STATUSES.PERMANENT) return true;
  if (normalized.date_status === DATE_STATUSES.SCHEDULED) return false;
  if (!normalized.end_date && !normalized.is_permanent) {
    return hasValidVerificationStatus(normalized.verification_status);
  }
  return normalized.date_status === DATE_STATUSES.CURRENT;
}

export function groupExhibitionsByDateStatus(items = [], options = {}) {
  const groups = { current: [], scheduled: [], permanent: [], ended: [] };
  items.forEach((item) => {
    const normalized = normalizeExhibitionDates(item, options);
    const enriched = { ...item, ...normalized };
    if (normalized.date_status === DATE_STATUSES.PERMANENT) groups.permanent.push(enriched);
    else if (normalized.date_status === DATE_STATUSES.SCHEDULED) groups.scheduled.push(enriched);
    else if (normalized.date_status === DATE_STATUSES.ENDED) groups.ended.push(enriched);
    else if (shouldShowAsCurrent(enriched, options)) groups.current.push(enriched);
  });
  return groups;
}

export function buildExhibitionArchiveUpdate(row = {}, options = {}) {
  const normalized = normalizeExhibitionDates(row, options);
  const nowIso = (options.now || new Date()).toISOString();
  const update = {
    start_date: normalized.start_date,
    end_date: normalized.end_date,
    is_permanent: normalized.is_permanent,
    date_status: normalized.date_status,
    source_url: normalized.source_url,
    source_last_checked_at: nowIso,
    content_last_verified_at: normalized.content_last_verified_at,
    verification_status: normalized.verification_status,
  };
  if (normalized.date_status === DATE_STATUSES.ENDED && !normalized.archived_at) {
    update.archived_at = nowIso;
  }
  return update;
}
