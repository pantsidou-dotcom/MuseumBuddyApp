import Head from 'next/head';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export default function Home({ items, q, gratis, kids }) {
  return (
    <>
      <Head>
        <title>MuseumBuddy — Musea</title>
        <meta name="description" content="Zoek en filter musea in Nederland." />
      </Head>

      <main style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        <h1 style={{ marginTop: 0 }}>Musea</h1>

        <form method="get" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input
            type="text"
            name="q"
            placeholder="Zoek op naam…"
            defaultValue={q || ''}
            style={{ flex: '1 1 260px', padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #ddd' }}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" name="gratis" value="1" defaultChecked={!!gratis} />
            Gratis
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" name="kids" value="1" defaultChecked={!!kids} />
            Kindvriendelijk
          </label>
          <button type="submit" style={{ padding: '0.5rem 0.75rem', borderRadius: 8, border: '1px solid #ddd', background: '#fafafa' }}>
            Zoeken
          </button>
        </form>

        {(!items || items.length === 0) ? (
          <p>Geen resultaten.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((m) => (
              <li key={m.id} style={{ borderBottom: '1px solid #eee', padding: '0.75rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>
                      <Link href={`/museum/${m.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {m.naam}
                      </Link>
                    </div>
                    <div style={{ color: '#666', fontSize: 14 }}>
                      {[m.stad, m.provincie].filter(Boolean).join(', ')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {m.gratis_toegankelijk && (
                      <span style={{ border: '1px solid #ddd', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Gratis</span>
                    )}
                    {m.kindvriendelijk && (
                      <span style={{ border: '1px solid #ddd', borderRadius: 999, padding: '2px 8px', fontSize: 12 }}>Kids</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

export async function getServerSideProps({ query }) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabase = createClient(url, anon);

  const q = typeof query.q === 'string' ? query.q.trim() : '';
  const gratis = query.gratis === '1';
  const kids = query.kids === '1';

  let db = supabase
    .from('musea')
    .select('id, naam, stad, provincie, slug, gratis_toegankelijk, kindvriendelijk')
    .order('naam', { ascending: true });

  if (q) {
    // case-insensitive zoeken op naam
    db = db.ilike('naam', `%${q}%`);
  }
  if (gratis) {
    db = db.eq('gratis_toegankelijk', true);
  }
  if (kids) {
    db = db.eq('kindvriendelijk', true);
  }

  const { data, error } = await db;

  if (error) {
    // Fallback: geen resultaten tonen i.p.v. hard crashen
    return { props: { items: [], q, gratis, kids } };
  }

  return {
    props: {
      items: data || [],
      q,
      gratis,
      kids,
    },
  };
}

