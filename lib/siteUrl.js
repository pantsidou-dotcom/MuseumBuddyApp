const DEFAULT_SITE_URL = 'https://museumbuddy.nl';

export function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL;
  return rawSiteUrl.replace(/\/+$/, '');
}
