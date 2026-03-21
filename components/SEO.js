import Head from 'next/head';
import { useRouter } from 'next/router';

import { getSiteUrl } from '../lib/siteUrl';
import { useLanguage } from './LanguageContext';

const SITE_URL = getSiteUrl();

function stripQueryAndHash(pathname = '/') {
  if (!pathname) return '/';
  const [withoutHash] = pathname.split('#');
  const [cleanPath] = withoutHash.split('?');
  return cleanPath || '/';
}

function toAbsoluteUrl(baseUrl, pathname = '/') {
  const cleanPath = stripQueryAndHash(pathname);
  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${baseUrl}${normalizedPath}`;
}

function resolveCanonical(customCanonical, baseUrl, fallbackPath) {
  if (!customCanonical) {
    return toAbsoluteUrl(baseUrl, fallbackPath);
  }
  if (/^https?:\/\//i.test(customCanonical)) {
    return customCanonical;
  }
  return toAbsoluteUrl(baseUrl, customCanonical);
}

function resolveImageUrl(image, baseUrl) {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) {
    return image;
  }
  const normalizedPath = image.startsWith('/') ? image : `/${image}`;
  return `${baseUrl}${normalizedPath}`;
}

function normalizeStructuredData(input) {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.filter(Boolean);
  }
  return [input];
}

function withLangParam(url, lang) {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('lang', lang);
    return parsed.toString();
  } catch (error) {
    return url;
  }
}

export default function SEO({ title, description, image, canonical, structuredData }) {
  const { asPath } = useRouter();
  const { lang } = useLanguage();
  const pathname = stripQueryAndHash(asPath || '/');
  const url = toAbsoluteUrl(SITE_URL, pathname);
  const canonicalUrl = resolveCanonical(canonical, SITE_URL, pathname);
  const ogImage = resolveImageUrl(image, SITE_URL);
  const structuredDataItems = normalizeStructuredData(structuredData);
  const nlHref = withLangParam(canonicalUrl, 'nl');
  const enHref = withLangParam(canonicalUrl, 'en');
  const xDefaultHref = lang === 'en' ? enHref : nlHref;

  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      <meta property="og:type" content="website" />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      {ogImage && <meta name="twitter:image" content={ogImage} />}
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="nl-NL" href={nlHref} />
      <link rel="alternate" hrefLang="en-US" href={enHref} />
      <link rel="alternate" hrefLang="x-default" href={xDefaultHref} />
      {structuredDataItems.map((item, index) => (
        <script
          key={`ld-json-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </Head>
  );
}
