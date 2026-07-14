import { absoluteUrl, SITE_ORIGIN } from './siteUrl';

export function breadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path || item.url || '/'),
    })),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MuseumBuddy',
    url: absoluteUrl('/'),
    inLanguage: 'nl-NL',
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MuseumBuddy',
    url: absoluteUrl('/'),
    logo: `${SITE_ORIGIN}/icons/icon-512.png`,
  };
}
