import museumOpeningHours from './museumOpeningHours.js';

export const DEFAULT_TIME_ZONE = 'Europe/Amsterdam';

function parseTime(value) {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim().replace('.', ':');
  const [hoursPart, minutesPart] = normalized.split(':');
  const hours = Number.parseInt(hoursPart, 10);
  const minutes = Number.parseInt(minutesPart, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 29) return null;
  if (minutes < 0 || minutes > 59) return null;
  return { minutes: hours * 60 + minutes, label: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}` };
}

export function getLocalMinutes(timeZone = DEFAULT_TIME_ZONE) {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hourPart = parts.find((part) => part.type === 'hour');
    const minutePart = parts.find((part) => part.type === 'minute');
    const hours = hourPart ? Number.parseInt(hourPart.value, 10) : NaN;
    const minutes = minutePart ? Number.parseInt(minutePart.value, 10) : NaN;
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  } catch (error) {
    // Fallback below
  }

  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function isOpenNow(hoursText, { timeZone = DEFAULT_TIME_ZONE } = {}) {
  if (!hoursText || typeof hoursText !== 'string') return null;

  const timeMatch = hoursText.match(/(\d{1,2}[:.]\d{2})\s*[–-]\s*(\d{1,2}[:.]\d{2})/);
  if (!timeMatch) {
    return null;
  }

  const start = parseTime(timeMatch[1]);
  const end = parseTime(timeMatch[2]);

  if (!start || !end) {
    return null;
  }

  let startMinutes = start.minutes;
  let endMinutes = end.minutes;
  const crossesMidnight = endMinutes <= startMinutes;

  if (crossesMidnight) {
    endMinutes += 24 * 60;
  }

  const nowMinutesBase = getLocalMinutes(timeZone);
  const nowMinutes = crossesMidnight && nowMinutesBase < startMinutes ? nowMinutesBase + 24 * 60 : nowMinutesBase;

  return nowMinutes >= startMinutes && nowMinutes < endMinutes;
}

function resolveOpeningHoursFromSlug(slug) {
  if (!slug) return null;
  const entry = museumOpeningHours[slug];
  if (!entry) return null;
  if (typeof entry.en === 'string' && entry.en.trim()) return entry.en;
  if (typeof entry.nl === 'string' && entry.nl.trim()) return entry.nl;
  return null;
}

export function resolveOpeningHoursSource(museumOrSlug) {
  if (!museumOrSlug) return null;

  if (typeof museumOrSlug === 'string') {
    return resolveOpeningHoursFromSlug(museumOrSlug);
  }

  if (typeof museumOrSlug === 'object') {
    const directCandidates = [
      museumOrSlug.openingstijden,
      museumOrSlug.opening_hours,
      museumOrSlug.openingHours,
      museumOrSlug.openinghours,
      museumOrSlug.hours,
    ];

    for (const candidate of directCandidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate;
      }
    }

    if (museumOrSlug.slug) {
      return resolveOpeningHoursFromSlug(museumOrSlug.slug);
    }
  }

  return null;
}

export function isMuseumOpenNow(museumOrSlug, { timeZone = DEFAULT_TIME_ZONE } = {}) {
  const hoursSource = resolveOpeningHoursSource(museumOrSlug);
  if (!hoursSource) return null;
  const open = isOpenNow(hoursSource, { timeZone });
  return open === null ? null : open;
}

