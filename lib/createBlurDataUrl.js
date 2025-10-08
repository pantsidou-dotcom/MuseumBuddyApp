const DEFAULT_COLOR = '#e2e8f0';
const WIDTH = 30;
const HEIGHT = 20;

function sanitizeColor(color) {
  if (typeof color !== 'string' || !color) {
    return DEFAULT_COLOR;
  }
  const normalized = color.startsWith('#') ? color : `#${color}`;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized) ? normalized : DEFAULT_COLOR;
}

export default function createBlurDataUrl(color = DEFAULT_COLOR) {
  const fill = sanitizeColor(color);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${WIDTH} ${HEIGHT}"><rect width="${WIDTH}" height="${HEIGHT}" fill="${fill}" /></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
