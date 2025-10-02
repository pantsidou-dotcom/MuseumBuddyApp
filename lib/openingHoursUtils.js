import museumOpeningHours from './museumOpeningHours';

const DAY_ORDER = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const DAY_INDEX = new Map(
  DAY_ORDER.map((day, index) => [day, index])
);

function toMinutes(timeString) {
  if (!timeString) return null;
  const [hourPart, minutePart = '0'] = String(timeString).split(':');
  const hours = Number.parseInt(hourPart, 10);
  const minutes = Number.parseInt(minutePart, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

function normaliseDayToken(token) {
  if (!token) return null;
  const trimmed = token.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.startsWith('daily') || trimmed.startsWith('every')) return 'daily';
  if (trimmed.startsWith('mon')) return 'mon';
  if (trimmed.startsWith('tue')) return 'tue';
  if (trimmed.startsWith('wed')) return 'wed';
  if (trimmed.startsWith('thu')) return 'thu';
  if (trimmed.startsWith('fri')) return 'fri';
  if (trimmed.startsWith('sat')) return 'sat';
  if (trimmed.startsWith('sun')) return 'sun';
  if (trimmed.startsWith('ma')) return 'mon';
  if (trimmed.startsWith('di')) return 'tue';
  if (trimmed.startsWith('wo')) return 'wed';
  if (trimmed.startsWith('do')) return 'thu';
  if (trimmed.startsWith('vr')) return 'fri';
  if (trimmed.startsWith('za')) return 'sat';
  if (trimmed.startsWith('zo')) return 'sun';
  return null;
}

function expandDayRange(startToken, endToken) {
  if (startToken === 'daily' || endToken === 'daily') {
    return DAY_ORDER;
  }
  if (!startToken) return [];
  if (!endToken) return [startToken];
  const startIndex = DAY_INDEX.get(startToken);
  const endIndex = DAY_INDEX.get(endToken);
  if (typeof startIndex !== 'number') return [];
  if (typeof endIndex !== 'number') return [];
  if (startIndex === endIndex) return [DAY_ORDER[startIndex]];
  const days = [];
  let current = startIndex;
  while (true) {
    days.push(DAY_ORDER[current]);
    if (current === endIndex) break;
    current = (current + 1) % DAY_ORDER.length;
    if (days.length > DAY_ORDER.length) break;
  }
  return days;
}

function parseDayExpression(expression) {
  if (!expression) return [];
  const cleaned = expression
    .replace(/\band\b/gi, ',')
    .replace(/\ben\b/gi, ',')
    .replace(/[–—]/g, '-')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return [];
  const segments = cleaned.split(',');
  const days = new Set();
  segments.forEach((segment) => {
    const trimmed = segment.trim();
    if (!trimmed) return;
    if (/^daily/i.test(trimmed) || /^dagelijks/i.test(trimmed)) {
      DAY_ORDER.forEach((day) => days.add(day));
      return;
    }
    const [startRaw, endRaw] = trimmed.split('-');
    const startToken = normaliseDayToken(startRaw);
    const endToken = normaliseDayToken(endRaw || startRaw);
    if (startToken === 'daily') {
      DAY_ORDER.forEach((day) => days.add(day));
      return;
    }
    if (!startToken) return;
    const expanded = expandDayRange(startToken, endToken || startToken);
    expanded.forEach((day) => days.add(day));
  });
  return Array.from(days).map((day) => DAY_INDEX.get(day));
}

function parseSegment(segment, fallbackOpenMinutes) {
  if (!segment) return [];
  const trimmed = segment.trim();
  if (!trimmed) return [];

  const untilMatch = trimmed.match(/^(?<days>[^0-9]+?)\s*(?:tot|until)\s*(?<close>\d{1,2}:\d{2})/i);
  if (untilMatch?.groups) {
    const dayIndices = parseDayExpression(untilMatch.groups.days);
    const closeMinutes = toMinutes(untilMatch.groups.close);
    const openMinutes = fallbackOpenMinutes ?? 0;
    return dayIndices
      .filter((index) => typeof index === 'number')
      .map((index) => ({ dayIndex: index, open: openMinutes, close: closeMinutes }));
  }

  const fullMatch = trimmed.match(
    /^(?<days>[^0-9]+?)\s*(?<open>\d{1,2}:\d{2})\s*[–-]\s*(?<close>\d{1,2}:\d{2})/i
  );
  if (fullMatch?.groups) {
    const dayIndices = parseDayExpression(fullMatch.groups.days);
    const openMinutes = toMinutes(fullMatch.groups.open);
    const closeMinutes = toMinutes(fullMatch.groups.close);
    return dayIndices
      .filter((index) => typeof index === 'number')
      .map((index) => ({ dayIndex: index, open: openMinutes, close: closeMinutes }));
  }

  return [];
}

function parseSchedule(hoursString) {
  if (!hoursString) return null;
  const withoutParens = hoursString.replace(/\(|\)/g, '|');
  const segments = withoutParens
    .split('|')
    .flatMap((part) => part.split(','))
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (!segments.length) return null;

  const schedule = Array.from({ length: 7 }, () => null);
  let defaultOpen = null;

  segments.forEach((segment) => {
    const resolved = parseSegment(segment, defaultOpen);
    if (!resolved.length) {
      return;
    }
    if (defaultOpen === null && resolved[0]?.open !== null) {
      defaultOpen = resolved[0].open;
    }
    resolved.forEach(({ dayIndex, open, close }) => {
      if (typeof dayIndex !== 'number') return;
      if (open === null || close === null) return;
      const existing = schedule[dayIndex];
      if (!existing) {
        schedule[dayIndex] = { open, close };
        return;
      }
      schedule[dayIndex] = {
        open: Math.min(existing.open, open),
        close: Math.max(existing.close, close),
      };
    });
  });

  return schedule;
}

function getScheduleForSlug(slug, fallbackHours) {
  if (!slug) return null;
  if (!getScheduleForSlug.cache) {
    getScheduleForSlug.cache = new Map();
  }
  const cache = getScheduleForSlug.cache;
  if (cache.has(slug)) {
    return cache.get(slug);
  }
  const provided = museumOpeningHours[slug];
  const schedule =
    parseSchedule(provided?.en) || parseSchedule(provided?.nl) || parseSchedule(fallbackHours);
  cache.set(slug, schedule || null);
  return schedule || null;
}

function getAmsterdamNow() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday')?.value?.toLowerCase() ?? 'sun';
  const hour = Number.parseInt(parts.find((part) => part.type === 'hour')?.value ?? '0', 10);
  const minute = Number.parseInt(parts.find((part) => part.type === 'minute')?.value ?? '0', 10);
  const dayIndex = DAY_INDEX.get(weekday.slice(0, 3)) ?? 0;
  const minutes = hour * 60 + minute;
  return { dayIndex, minutes };
}

function isOpenOnDay(schedule, dayIndex) {
  if (!schedule) return false;
  const entry = schedule[dayIndex];
  if (!entry) return false;
  return typeof entry.open === 'number' && typeof entry.close === 'number' && entry.close > entry.open;
}

export function resolveAvailability(slug, fallbackHours) {
  const schedule = getScheduleForSlug(slug, fallbackHours);
  if (!schedule) {
    return {
      openNow: null,
      openToday: null,
      openThisWeekend: null,
    };
  }
  const { dayIndex, minutes } = getAmsterdamNow();
  const todayEntry = schedule[dayIndex];
  const openNow = todayEntry
    ? minutes >= todayEntry.open && minutes < todayEntry.close
    : false;
  const openToday = isOpenOnDay(schedule, dayIndex);
  const weekendOpen = isOpenOnDay(schedule, DAY_INDEX.get('sat') ?? 6) ||
    isOpenOnDay(schedule, DAY_INDEX.get('sun') ?? 0);

  return {
    openNow,
    openToday,
    openThisWeekend: weekendOpen,
  };
}

export function isOpenForDatePreference(availability, preference) {
  if (!availability) return true;
  if (preference === 'weekend') {
    if (availability.openThisWeekend === null) return false;
    return availability.openThisWeekend;
  }
  if (preference === 'today') {
    if (availability.openToday === null) return false;
    return availability.openToday;
  }
  return true;
}
