import Head from 'next/head';
import { useRouter } from 'next/router';

const SITE_URL = 'https://museumbuddy.nl';

export default function SEO({ title, description, image, canonical }) {
  const { asPath } = useRouter();
  const url = `${SITE_URL}${asPath}`;
  const canonicalUrl = canonical || url;

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
