import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';
import MuseumCard from '../components/MuseumCard';
import museumImages from '../lib/museumImages';
import museumNames from '../lib/museumNames';
import museumSummaries from '../lib/museumSummaries';

function formatDate(d) {
  if (!d) return '';
  try {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
}

function todayYMD(tz = 'Europe/Amsterdam') {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export default function Home({ items, q, exposities }) {
  const todayStr = todayYMD('Europe/Amsterdam');
  const today = new Date(todayStr + 'T00:00:00');

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
          {q && (
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
                }}
              />
            </li>
          ))}
        </ul>
      )}

      {exposities.length > 0 && (
        <section style={{ marginTop: '2rem' }}>
          <h2>Exposities</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {exposities.map((e) => {
              const start = e.start_datum ? new Date(e.start_datum + 'T00:00:00') : null;
              const end = e.eind_datum ? new Date(e.eind_datum + 'T00:00:00') : null;

              let status = '';
              if (start && start > today) status = 'Komt eraan';
              else if ((!start || start <= today) && (!end || end >= today)) status = 'Loopt nu';

              const periode = [formatDate(e.start_datum), formatDate(e.eind_datum)]
                .filter(Boolean)
                .join(' – ');

              const inhoud = (
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ fontWeight: 600 }}>{e.titel}</div>
                    {status && (
                      <span
                        style={{
                          border: '1px solid #ddd',
                          borderRadius: 999,
                          padding: '2px 8px',
                          fontSize: 12,
                        }}
                      >
                        {status}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#666', fontSize: 14 }}>
                    {[e.musea?.naam, periode].filter(Boolean).join(' – ')}
                  </div>
                </div>
              );

              return (
                <li key={e.id} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0' }}>
                  {e.bron_url ? (
                    <a
                      href={e.bron_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      {inhoud}
                    </a>
                  ) : (
                    inhoud
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}

export async function getServerSideProps({ query }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, anon);

  const q = typeof query.q === 'string' ? query.q.trim() : '';

  let db = supabase
    .from('musea')
    .select('id, naam, stad, provincie, slug, gratis_toegankelijk')
    .order('naam', { ascending: true });

  if (q) {
    db = db.ilike('naam', `%${q}%`);
  }

  const { data, error } = await db;

  const today = todayYMD('Europe/Amsterdam');
  const { data: exposities, error: exError } = await supabase
    .from('exposities')
    .select('id, titel, start_datum, eind_datum, bron_url, musea (naam)')
    .or(`eind_datum.gte.${today},eind_datum.is.null`)
    .order('start_datum', { ascending: true, nullsFirst: false });

  if (error || exError) {
    return { props: { items: [], q, exposities: [] } };
  }

  return {
    props: {
      items: data || [],
      q,
      exposities: exposities || [],
    },
  };
}
