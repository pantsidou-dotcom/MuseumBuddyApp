import Link from 'next/link';
import SEO from '../../components/SEO';
import MuseumCard from '../../components/MuseumCard';
import { buildDiscoveryPage, DISCOVERY_PAGE_CONFIGS } from '../../lib/discoveryPages.js';
import { getStaticMuseums } from '../../lib/staticMuseums.js';
import { getStaticExhibitions } from '../../lib/staticExhibitions.js';

export async function getStaticPaths() {
  return { paths: Object.keys(DISCOVERY_PAGE_CONFIGS).map((slug) => ({ params: { slug } })), fallback: false };
}

export async function getStaticProps({ params }) {
  const page = buildDiscoveryPage(params.slug, { museums: getStaticMuseums(), exhibitions: getStaticExhibitions() });
  return { props: { page: { ...page, robots: page.robots || null } } };
}

export default function DiscoveryPage({ page }) {
  const { config, results, robots, updatedAt, canonical, indexable } = page;
  const structuredData = indexable ? {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: config.heading,
    description: config.intro,
    mainEntity: { '@type': 'ItemList', numberOfItems: results.length, itemListElement: results.map((item, index) => ({ '@type': 'ListItem', position: index + 1, name: item.naam || item.title, url: item.slug ? `https://museumbuddy.nl/museum/${item.slug}` : undefined })) },
  } : null;

  return <>
    <SEO title={config.title} description={config.intro} canonical={canonical} robots={robots} structuredData={structuredData} image="/images/og-home.svg" />
    <section className="page-intro">
      <p><Link href="/">Alle musea</Link> · <Link href="/tentoonstellingen">Tentoonstellingen</Link></p>
      <h1 className="page-title">{config.heading}</h1>
      <p className="page-subtitle">{config.intro}</p>
      <p><strong>Selectiecriteria:</strong> {config.criteria}</p>
      <p><strong>Laatst bijgewerkt:</strong> {updatedAt}</p>
    </section>
    {!indexable ? <p>Deze pagina heeft nu te weinig relevante resultaten en krijgt daarom noindex.</p> : null}
    <p className="count">{results.length} resultaten</p>
    <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {results.map((item, index) => item.slug ? <li key={item.slug}><MuseumCard museum={item} priority={index < 3} /></li> : <li key={item.id || item.title}><article className="card"><h2>{item.title}</h2><p>{item.museumName || item.museum_name}</p><p>{item.end_date ? `Tot en met ${item.end_date}` : null}</p></article></li>)}
    </ul>
    {config.faq?.length ? <section className="museum-guide-section"><h2>Veelgestelde vragen</h2>{config.faq.map(([q,a])=><details key={q} className="guide-faq-item"><summary>{q}</summary><p>{a}</p></details>)}</section> : null}
    <section className="museum-guide-section"><h2>Verder ontdekken</h2><p>{Object.values(DISCOVERY_PAGE_CONFIGS).filter((other)=>other.path !== canonical).slice(0,4).map((other, idx)=><span key={other.path}>{idx ? ' · ' : ''}<Link href={other.path}>{other.heading}</Link></span>)}</p></section>
  </>;
}
