import Link from 'next/link';
import museaData from '../../musea.json';

export default function MuseumPage({ museum }) {
  if (!museum) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Museum niet gevonden</h1>
        <p>Dit museum bestaat niet.</p>
        <p><Link href="/">&larr; Terug naar overzicht</Link></p>
      </main>
    );
  }

  const image = museum.image || (museum.images && museum.images[0]);

  return (
    <main style={{ padding: 24 }}>
      <p><Link href="/">&larr; Terug</Link></p>
      <h1>{museum.title}</h1>
      {image && (
        <img
          alt={museum.title}
          src={image}
          style={{ maxWidth: 600, width: '100%', height: 'auto', display: 'block', marginTop: 16 }}
        />
      )}
      <p style={{ marginTop: 16 }}>{museum.description}</p>
      {museum.openingHours && (
        <p style={{ marginTop: 16 }}>
          <strong>Openingstijden:</strong> {museum.openingHours}
        </p>
      )}
      {museum.url && (
        <p style={{ marginTop: 16 }}>
          <a href={museum.url} target="_blank" rel="noreferrer">Website</a>
        </p>
      )}
    </main>
  );
}

// Genereer alle routes op basis van musea.json
export async function getStaticPaths() {
  const items = Array.isArray(museaData) ? museaData : (museaData.musea || []);
  const paths = items
    .filter(m => m && m.id != null)
    .map(m => ({ params: { id: String(m.id) } }));
  return { paths, fallback: false };
}

// Geef de juiste museumdata aan de pagina
export async function getStaticProps({ params }) {
  const items = Array.isArray(museaData) ? museaData : (museaData.musea || []);
  const museum = items.find(m => String(m.id) === String(params.id)) || null;
  return { props: { museum } };
}
