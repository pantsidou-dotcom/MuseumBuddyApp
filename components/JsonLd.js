import Head from 'next/head';

function normalizeStructuredData(input) {
  if (!input) return [];
  return (Array.isArray(input) ? input : [input]).filter(Boolean);
}

function escapeJsonForHtml(data) {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export default function JsonLd({ data }) {
  const items = normalizeStructuredData(data);
  if (!items.length) return null;

  return (
    <Head>
      {items.map((item, index) => (
        <script
          key={`ld-json-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonForHtml(item) }}
        />
      ))}
    </Head>
  );
}
