const DUTCH_LOCALE = 'nl-NL';

function normaliseDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }
    const isoDate = new Date(`${trimmed}T00:00:00`);
    if (!Number.isNaN(isoDate.getTime())) {
      return isoDate;
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return null;
}

function formatLabel(date, includeYear = false) {
  const formatter = new Intl.DateTimeFormat(DUTCH_LOCALE, {
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
  });

  const parts = formatter.formatToParts(date);
  const dayPart = parts.find((part) => part.type === 'day');
  const monthPart = parts.find((part) => part.type === 'month');
  const yearPart = parts.find((part) => part.type === 'year');

  if (!dayPart || !monthPart) {
    return '';
  }

  const day = Number.parseInt(dayPart.value, 10).toString();
  const month = (monthPart.value || '').toLowerCase();

  if (!month) {
    return '';
  }

  let label = `${day} ${month}`;

  if (includeYear && yearPart?.value) {
    label = `${label} ${yearPart.value}`;
  }

  return label;
}

export function formatDutchDate(dateInput, { includeYear, currentDate = new Date() } = {}) {
  const date = normaliseDate(dateInput);
  if (!date) {
    return '';
  }

  let needsYear;
  if (typeof includeYear === 'boolean') {
    needsYear = includeYear;
  } else {
    const referenceYear =
      currentDate instanceof Date && !Number.isNaN(currentDate.getTime())
        ? currentDate.getFullYear()
        : new Date().getFullYear();
    needsYear = date.getFullYear() !== referenceYear;
  }

  return formatLabel(date, needsYear);
}

export function formatDutchDateRange(startInput, endInput, { currentDate = new Date() } = {}) {
  const startDate = normaliseDate(startInput);
  if (!startDate) {
    return '';
  }

  const endDate = normaliseDate(endInput);
  const referenceYear =
    currentDate instanceof Date && !Number.isNaN(currentDate.getTime())
      ? currentDate.getFullYear()
      : new Date().getFullYear();

  const startYear = startDate.getFullYear();
  const endYear = endDate ? endDate.getFullYear() : startYear;

  const startNeedsYear = endDate ? startYear !== endYear : startYear !== referenceYear;
  const endNeedsYear = endDate
    ? startYear !== endYear || endYear !== referenceYear
    : startNeedsYear;

  const startLabel = formatLabel(startDate, startNeedsYear);
  if (!startLabel) {
    return '';
  }

  if (!endDate) {
    return startLabel;
  }

  const endLabel = formatLabel(endDate, endNeedsYear);
  if (!endLabel) {
    return startLabel;
  }

  return `${startLabel} – ${endLabel}`;
}

export default formatDutchDateRange;
