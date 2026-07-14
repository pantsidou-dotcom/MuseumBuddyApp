import Head from 'next/head';
import { useRouter } from 'next/router';

import JsonLd from './JsonLd';
import { absoluteUrl, cleanPathname, getSiteUrl } from '../lib/siteUrl';

const SITE_URL = getSiteUrl();

function toAbsoluteUrl(pathname = '/') {
  return absoluteUrl(pathname);
}

function resolveCanonical(customCanonical, fallbackPath) {
  if (!customCanonical) {
    return toAbsoluteUrl(fallbackPath);
  }
  if (/^https?:\/\//i.test(customCanonical)) {
    return absoluteUrl(new URL(customCanonical).pathname);
  }
  return toAbsoluteUrl(customCanonical);
}

function resolveImageUrl(image, baseUrl) {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) {
    return image;
  }
  const normalizedPath = image.startsWith('/') ? image : `/${image}`;
  return `${baseUrl}${normalizedPath}`;
}

export default function SEO({ title, description, image, canonical, structuredData, robots }) {
  const { asPath } = useRouter();
  const pathname = cleanPathname(asPath || '/');
  const url = toAbsoluteUrl(pathname);
  const canonicalUrl = resolveCanonical(canonical, pathname);
  const ogImage = resolveImageUrl(image, SITE_URL);

  return (
    <>
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
      </Head>
      <JsonLd data={structuredData} />
    </>
  );
}
