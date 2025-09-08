import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import MuseumCard from '../components/MuseumCard';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumSummaries from '../lib/museumSummaries';

function todayYMD(tz = 'Europe/Amsterdam') {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export default function Home({ items, q, hasExposities }) {
  const expositiesHref = q ? `/?q=${encodeURIComponent(q)}&exposities=1` : '/?exposities=1';

  return (
    <>
      <Head>
        <title>MuseumBuddy — Museums</title>
        <meta name="description" content="Search and filter museums in the Netherlands." />
      </Head>

      <form method="get" className="controls">
        <div className="control-row">
          <input
            type="text"
            name="q"
            className="input"
            placeholder="Search"
            defaultValue={q || ''}
          />
          <a href={expositiesHref} className="btn-reset">
            Exposities
          </a>
          {(q || hasExposities) && (
            <a href="/" className="btn-reset">
              Reset
            </a>
          )}
        </div>
      </form>

      <p className="count">{items.length} results</p>

      {items.length === 0 ? (
        <p>No results.</p>
      ) : (
        <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {items.map((m) => (
            <li key={m.id}>
              <MuseumCard
                museum={{
                  id: m.id,
                  slug: m.slug,
                  title: museumNames[m.slug] || m.naam,
                  city: m.stad,
                  province: m.provincie,
                  free: m.gratis_toegankelijk,
                  summary: museumSummaries[m.slug],
                  image: museumImages[m.slug],
                  ticketUrl: m.ticket_affiliate_url,
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export async function getServerSideProps({ query }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, anon);

  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const hasExposities = Object.prototype.hasOwnProperty.call(query, 'exposities');

  let db = supabase
    .from('musea')
    .select('id, naam, stad, provincie, slug, gratis_toegankelijk, ticket_affiliate_url')
    .order('naam', { ascending: true });

  if (q) {
    db = db.ilike('naam', `%${q}%`);
  }

  if (hasExposities) {
    const today = todayYMD('Europe/Amsterdam');
    const { data: exRows, error: exError } = await supabase
      .from('exposities')
      .select('museum_id')
      .or(`eind_datum.gte.${today},eind_datum.is.null`);

    if (exError) {
      return { props: { items: [], q, hasExposities } };
    }

    const ids = [...new Set((exRows || []).map((e) => e.museum_id))];

    if (ids.length === 0) {
      return { props: { items: [], q, hasExposities } };
    }

    db = db.in('id', ids);
  }

  const { data, error } = await db;

  if (error) {
    return { props: { items: [], q, hasExposities } };
  }

  return {
    props: {
      items: data || [],
      q,
      hasExposities,
    },
  };
}
