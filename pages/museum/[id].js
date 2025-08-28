import Link from 'next/link';
import museaData from '../../musea.json';

export default function MuseumPage({ museum }) {
  if (!museum) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Museum niet gevonden</h1>
        <p><Link href="/">&larr; Terug naar overzicht</Link></p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 800, margin: '0 auto' }}>
      <p><Link href="/">&larr; Terug naar overzicht</Link></p>
      <h1 style={{ marginBottom: 0 }}>{museum.title}</h1>
      <p style={{ marginTop: 6, color: '#666' }}>{museum.city}</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
        {museum.free && <Badge>Gratis</Badge>}
        {museum.kidFriendly && <Badge>Kindvriendelijk</Badge>}
        {museum.temporary && <Badge>Tijdelijk</Badge>}
      </div>

      {museum.description && <p style={{ marginTop: 16 }}>{museum.description}</p>}

      {museum.url && (
        <p style={{ marginTop: 16 }}>
          <a href={museum.url} target="_blank" rel="noreferrer">Website openen</a>
        </p>
      )}
    </main>
  );
}

export async function getStaticPaths() {
  const items = Array.isArray(museaData) ? museaData : (museaData.musea || []);
  const paths = items
    .filter(m => m && m.id != null)
    .map(m => ({ params: { id: String(m.id) } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const items = Array.isArray(museaData) ? museaData : (museaData.musea || []);
  const museum = items.find(m => String(m.id) === String(params.id)) || null;
  return { props: { museum } };
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
