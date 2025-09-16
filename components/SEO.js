import Head from 'next/head';
import { useRouter } from 'next/router';

const RAW_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://museumbuddy.nl';
const SITE_URL = RAW_SITE_URL.replace(/\/+$/, '');

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

export default function SEO({ title, description, image, canonical }) {
  const { asPath } = useRouter();
  const pathname = stripQueryAndHash(asPath || '/');
  const url = toAbsoluteUrl(SITE_URL, pathname);
  const canonicalUrl = resolveCanonical(canonical, SITE_URL, pathname);

  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      <meta property="og:type" content="website" />
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content="summary_large_image" />
      {title && <meta name="twitter:title" content={title} />}
      {description && <meta name="twitter:description" content={description} />}
      {image && <meta name="twitter:image" content={image} />}
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}
