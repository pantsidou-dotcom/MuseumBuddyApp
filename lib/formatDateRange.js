const LANGUAGE_CONFIG = {
  nl: {
    locale: 'nl-NL',
    transformMonth: (value) => value.toLowerCase(),
  },
  en: {
    locale: 'en-GB',
    transformMonth: (value) => {
      if (!value) return value;
      const lower = value.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    },
  },
};

function getLanguageConfig(language) {
  if (language && LANGUAGE_CONFIG[language]) {
    return LANGUAGE_CONFIG[language];
  }
  return LANGUAGE_CONFIG.nl;
}

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

function formatLabel(date, includeYear = false, { locale, transformMonth }) {
  const formatter = new Intl.DateTimeFormat(locale, {
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
  const rawMonth = monthPart.value || '';
  const month = typeof transformMonth === 'function' ? transformMonth(rawMonth) : rawMonth;

  if (!month) {
    return '';
  }

  let label = `${day} ${month}`;

  if (includeYear && yearPart?.value) {
    label = `${label} ${yearPart.value}`;
  }

  return label;
}

export function formatDate(dateInput, {
  includeYear,
  currentDate = new Date(),
  language,
} = {}) {
  const date = normaliseDate(dateInput);
  if (!date) {
    return '';
  }

  const languageConfig = getLanguageConfig(language);

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

  return formatLabel(date, needsYear, languageConfig);
}

export function formatDateRange(startInput, endInput, {
  currentDate = new Date(),
  language,
} = {}) {
  const startDate = normaliseDate(startInput);
  if (!startDate) {
    return '';
  }

  const endDate = normaliseDate(endInput);
  const languageConfig = getLanguageConfig(language);
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

  const startLabel = formatLabel(startDate, startNeedsYear, languageConfig);
  if (!startLabel) {
    return '';
  }

  if (!endDate) {
    return startLabel;
  }

  const endLabel = formatLabel(endDate, endNeedsYear, languageConfig);
  if (!endLabel) {
    return startLabel;
  }

  return `${startLabel} – ${endLabel}`;
}

export function formatDutchDate(dateInput, options = {}) {
  return formatDate(dateInput, { ...options, language: 'nl' });
}

export function formatDutchDateRange(startInput, endInput, options = {}) {
  return formatDateRange(startInput, endInput, { ...options, language: 'nl' });
}

export function formatEnglishDate(dateInput, options = {}) {
  return formatDate(dateInput, { ...options, language: 'en' });
}

export function formatEnglishDateRange(startInput, endInput, options = {}) {
  return formatDateRange(startInput, endInput, { ...options, language: 'en' });
}

export default formatDutchDateRange;
