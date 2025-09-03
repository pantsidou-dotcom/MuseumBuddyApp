import { useMemo, useState } from 'react';
import museaData from '../musea.json';
import MuseumCard from '../components/MuseumCard';

export async function getStaticProps() {
  const musea = Array.isArray(museaData) ? museaData : (museaData.musea || []);
  return { props: { musea } };
}

export default function Home({ musea }) {
  const [query, setQuery] = useState('');
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

      const matchesCity = !city || m.city === city;

      return matchesQuery && matchesCity;
    });
  }, [musea, query, city]);

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
            <li key={m.id}>
              <MuseumCard museum={m} />
            </li>
          ))}
        </ul>
    </>
  );
}

