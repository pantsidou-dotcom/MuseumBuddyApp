import Head from 'next/head';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import MuseumCard from '../components/MuseumCard';

export default function Home({ items, q, gratis, kids }) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <>
      <Head>
        <title>MuseumBuddy — Museums</title>
        <meta name="description" content="Search and filter museums in the Netherlands." />
      </Head>

      <form method="get" className="controls">
        <div className="control-row">
          <select name="type" className="select" defaultValue="musea">
            <option value="musea">Museums</option>
          </select>
          <button
            type="button"
            className="btn-reset"
            onClick={() => setShowFilters((v) => !v)}
          >
            Filters
          </button>
          <input
            type="text"
            name="q"
            className="input"
            placeholder="Search"
            defaultValue={q || ''}
          />
        </div>
        {showFilters && (
          <div className="control-row">
            <label className="checkbox">
              <input type="checkbox" name="gratis" value="1" defaultChecked={!!gratis} />
              Free
            </label>
            <label className="checkbox">
              <input type="checkbox" name="kids" value="1" defaultChecked={!!kids} />
              Kid-friendly
            </label>
            {(q || gratis || kids) && (
              <a href="/" className="btn-reset">
                Reset
              </a>
            )}
          </div>
        )}
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
                  title: m.naam,
                  city: m.stad,
                  province: m.provincie,
                  free: m.gratis_toegankelijk,
                  kids: m.kindvriendelijk,
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
  const gratis = query.gratis === '1';
  const kids = query.kids === '1';

  let db = supabase
    .from('musea')
    .select('id, naam, stad, provincie, slug, gratis_toegankelijk, kindvriendelijk')
    .order('naam', { ascending: true });

  if (q) {
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
