   // vercel ping
import { useMemo, useState } from 'react';
import Link from 'next/link';
import museaData from '../musea.json';

export async function getStaticProps() {
  const musea = Array.isArray(museaData) ? museaData : (museaData.musea || []);
  return { props: { musea } };
}

export default function Home({ musea }) {
  const [query, setQuery] = useState('');
  const [onlyFree, setOnlyFree] = useState(false);
  const [onlyKids, setOnlyKids] = useState(false);
  const [onlyTemporary, setOnlyTemporary] = useState(false);
  const cities = useMemo(() => Array.from(new Set(musea.map(m => m.city))).sort(), [musea]);
  const [city, setCity] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return musea.filter(m => {
      const matchesQuery =
        !q ||
        (m.title && m.title.toLowerCase().includes(q)) ||
        (m.city && m.city.toLowerCase().includes(q)) ||
        (Array.isArray(m.tags) && m.tags.join(' ').toLowerCase().includes(q));

      const matchesFree = !onlyFree || Boolean(m.free);
      const matchesKids = !onlyKids || Boolean(m.kidFriendly);
      const matchesTemp = !onlyTemporary || Boolean(m.temporary);
      const matchesCity = !city || m.city === city;

      return matchesQuery && matchesFree && matchesKids && matchesTemp && matchesCity;
    });
  }, [musea, query, onlyFree, onlyKids, onlyTemporary, city]);

  return (
    <>
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
          <label className="checkbox"><input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} /> Gratis toegankelijk</label>
          <label className="checkbox"><input type="checkbox" checked={onlyKids} onChange={(e) => setOnlyKids(e.target.checked)} /> Kindvriendelijk</label>
          <label className="checkbox"><input type="checkbox" checked={onlyTemporary} onChange={(e) => setOnlyTemporary(e.target.checked)} /> Tijdelijke exposities</label>
        </div>

        <div className="control-row">
          <select className="select" value={city} onChange={(e) => setCity(e.target.value)} style={{ maxWidth: 260 }}>
            <option value="">Alle steden</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {city && <button className="btn-reset" onClick={() => setCity('')}>Reset stad</button>}
        </div>
      </section>

      <p className="count">{filtered.length} resultaat{filtered.length === 1 ? '' : 'ten'}</p>

      {/* Grid met kaarten */}
      <ul className="grid" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {filtered.map(m => (
          <li key={m.id} className="card">
          {m.image && (
  <img
    className="card-img"
    src={m.image}
    alt={m.title}
    loading="lazy"
  />
)}

            <div className="card-head">
              <div>
                <h2 className="card-title">
                  <Link className="link-accent" href={`/museum/${m.id}`}>{m.title}</Link>
                </h2>
                <p className="card-sub">{m.city}</p>
              </div>
              <div className="chips">
                {m.free && <span className="chip">Gratis</span>}
                {m.kidFriendly && <span className="chip">Kindvriendelijk</span>}
                {m.temporary && <span className="chip">Tijdelijk</span>}
              </div>
            </div>

            {m.description && <p style={{ marginTop: 10 }}>{m.description}</p>}
              


            {Array.isArray(m.tags) && m.tags.length > 0 && (
              <p style={{ marginTop: 8 }}>
                {m.tags.map(t => <span key={t} className="tag">#{t}</span>)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

