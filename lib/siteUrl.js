export const SITE_ORIGIN = 'https://www.museumbuddy.nl';

export function getSiteUrl() {
  return SITE_ORIGIN;
}

export function cleanPathname(pathname = '/') {
  if (!pathname) return '/';
  const [withoutHash] = String(pathname).split('#');
  const [cleanPath] = withoutHash.split('?');
  if (!cleanPath || cleanPath === '/') return '/';
  return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
}

export function absoluteUrl(pathname = '/') {
  const cleanPath = cleanPathname(pathname);
  return `${SITE_ORIGIN}${cleanPath === '/' ? '/' : cleanPath}`;
}
