export default function parseBooleanParam(value) {
  if (Array.isArray(value)) {
    return value.some((item) => parseBooleanParam(item));
  }

  if (value === undefined || value === null) return false;

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return true;
    if (['1', 'true', 'yes', 'ja', 'waar'].includes(normalized)) return true;
    return false;
  }

  return Boolean(value);
}

