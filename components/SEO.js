import Head from 'next/head';
import { useRouter } from 'next/router';

import { getSiteUrl } from '../lib/siteUrl';

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

export default function SEO({ title, description, image, canonical, structuredData }) {
  const { asPath } = useRouter();
  const pathname = stripQueryAndHash(asPath || '/');
  const url = toAbsoluteUrl(SITE_URL, pathname);
  const canonicalUrl = resolveCanonical(canonical, SITE_URL, pathname);
  const ogImage = resolveImageUrl(image, SITE_URL);
  const structuredDataItems = normalizeStructuredData(structuredData);

  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {robots && <meta name="robots" content={robots} />}
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
