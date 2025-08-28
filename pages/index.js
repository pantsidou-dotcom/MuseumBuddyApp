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

  const cities = useMemo(() => {
    return Array.from(new Set(musea.map(m => m.city))).sort();
  }, [musea]);
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
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 8 }}>MuseumBuddy</h1>
      <p style={{ color: '#555', marginTop: 0 }}>Zoek en filter musea (zoals Museumkaart / museum.nl)</p>

      {/* Filters */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 12,
          padding: 12,
          border: '1px solid #eee',
          borderRadius: 12,
          margin: '16px 0'
        }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Zoek op naam, stad of tag…"
          type="search"
          style={{ padding: 12, borderRadius: 8, border: '1px solid #ddd' }}
        />

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <label><input type="checkbox" checked={onlyFree} onChange={(e) => setOnlyFree(e.target.checked)} /> Gratis toegankelijk</label>
          <label><input type="checkbox" checked={onlyKids} onChange={(e) => setOnlyKids(e.target.checked)} /> Kindvriendelijk</label>
          <label><input type="checkbox" checked={onlyTemporary} onChange={(e) => setOnlyTemporary(e.target.checked)} /> Tijdelijke exposities</label>
        </div>

        <div>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #ddd', minWidth: 200 }}
          >
            <option value="">Alle steden</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {city && (
            <button
              onClick={() => setCity('')}
              style={{ marginLeft: 10, padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#f7f7f7', cursor: 'pointer' }}
            >
              Reset stad
            </button>
          )}
        </div>
      </section>

      <p style={{ margin: '16px 0', color: '#555' }}>
        {filtered.length} resultaat{filtered.length === 1 ? '' : 'ten'}
      </p>

      {/* Lijst */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
        {filtered.map(m => (
          <li key={m.id} style={{ border: '1px solid #eee', borderRadius: 12, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 20 }}>
                  <Link href={`/museum/${m.id}`}>{m.title}</Link>
                </h2>
                <p style={{ margin: '6px 0', color: '#666' }}>{m.city}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {m.free && <Badge>Gratis</Badge>}
                {m.kidFriendly && <Badge>Kindvriendelijk</Badge>}
                {m.temporary && <Badge>Tijdelijk</Badge>}
              </div>
            </div>

            {m.description && <p style={{ marginTop: 8 }}>{m.description}</p>}

            {Array.isArray(m.tags) && m.tags.length > 0 && (
              <p style={{ marginTop: 8, color: '#777' }}>
                {m.tags.map(t => <span key={t} style={{ marginRight: 8 }}>#{t}</span>)}
              </p>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

function Badge({ children }) {
  return (
    <span style={{
      fontSize: 12,
      padding: '4px 8px',
      borderRadius: 999,
      border: '1px solid #ddd',
      background: '#fafafa'
    }}>
      {children}
    </span>
  );
}
