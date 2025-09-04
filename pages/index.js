 // pages/index.js — leest nu uit Supabase i.p.v. musea.json
import Head from 'next/head';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import MuseumCard from '../components/MuseumCard';

// We halen data server-side op, zodat je live DB gebruikt
export async function getServerSideProps() {
  if (!supabase) {
    const errorMsg =
      'Supabase client not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
    console.error('[Supabase] index client error:', errorMsg);
    return { props: { musea: [], error: errorMsg } };
  }

  // Haal alle musea op (je kunt hier filters toevoegen als je wilt)
  const { data, error } = await supabase
    .from('musea')
    .select('*')
    .order('stad', { ascending: true });

  if (error) {
    console.error('[Supabase] index query error:', error.message);
  }

  // Normaliseer naar de vorm die jouw MuseumCard waarschijnlijk verwacht
  // (title/city/tags/slug). Pas aan als MuseumCard meer velden nodig heeft.
  const musea = (data || []).map((m) => ({
    id: m.id,
    title: m.naam,          // jouw JSON had 'title'; uit DB komt 'naam'
    city: m.stad || '',     // jouw JSON had 'city'; uit DB komt 'stad'
    tags: [
      ...(m.gratis_toegankelijk ? ['gratis'] : []),
      ...(m.kindvriendelijk ? ['kindvriendelijk'] : [])
    ],
    slug: m.slug,           // voor link naar detailpagina
    provincie: m.provincie || '',
    website: m.website_url || '',
    // voeg eventueel andere props toe die MuseumCard gebruikt
  }));

  return { props: { musea, error: error ? error.message : null } };
}

export default function Home({ musea, error }) {
  const [query, setQuery] = useState('');
  const cities = useMemo(
    () => Array.from(new Set(musea.map((m) => m.city).filter(Boolean))).sort(),
    [musea]
  );
  const [city, setCity] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return musea.filter((m) => {
      const matchesQuery =
        !q ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.city && m.city.toLowerCase().includes(q)) ||
        (Array.isArray(m.tags) && m.tags.join(' ').toLowerCase().includes(q));

      const matchesCity = !city || m.city === city;

      return matchesQuery && matchesCity;
    });
  }, [musea, query, city]);

  if (error) {
    return (
      <>
        <Head>
          <title>MuseumBuddy</title>
        </Head>
        <p>{error}</p>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>MuseumBuddy</title>
        <meta name="description" content="Vind musea en exposities in Nederland" />
      </Head>

      <h1 className="page-title">Zoek musea</h1>
      <p className="page-subtitle">Vind musea en exposities in Nederland</p>

      {/* Filters */}
      <section className="section controls">
        <input
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op naam, stad of tag…"
          type="search"
        />

        <div className="control-row">
          <select
            className="select"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ maxWidth: 260 }}
          >
            <option value="">Alle steden</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {city && (
            <button className="btn-reset" onClick={() => setCity('')}>
              Reset stad
            </button>
          )}
        </div>
      </section>

      <p className="count">
        {filtered.length} resultaat{filtered.length === 1 ? '' : 'ten'}
      </p>

      {/* Grid met kaarten */}
      <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filtered.map((m) => (
          <li key={m.id}>
            {/* MuseumCard blijft werken; hij krijgt nu museum uit DB (genormaliseerd) */}
            <MuseumCard museum={m} />

            {/* Optioneel: als je geen MuseumCard-link hebt, kun je deze link laten staan */}
            {/* <Link href={`/museum/${m.slug}`}>Bekijk</Link> */}
          </li>
        ))}
      </ul>
    </>
  );
}
