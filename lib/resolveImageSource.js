function isStaticImport(image) {
  return Boolean(image && typeof image === 'object' && 'src' in image);
}

function normalizePath(path) {
  if (typeof path !== 'string') return null;
  const trimmed = path.trim();
  if (!trimmed) return null;
  const withoutLeadingSlashes = trimmed.replace(/^\/+/, '');
  return `/${withoutLeadingSlashes}`;
}

export function normalizeImageSource(image) {
  if (!image) return null;
  if (isStaticImport(image)) {
    return image;
  }
  if (typeof image !== 'string') {
    return null;
  }
  const trimmed = image.trim();
  if (!trimmed) {
    return null;
  }
  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return normalizePath(trimmed);
}

export function resolveImageUrl(image) {
  if (!image) return null;
  if (isStaticImport(image)) {
    return image.src || null;
  }
  if (typeof image !== 'string') {
    return null;
  }
  const trimmed = image.trim();
  if (!trimmed) {
    return null;
  }
  if (/^(https?:|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return normalizePath(trimmed);
}
