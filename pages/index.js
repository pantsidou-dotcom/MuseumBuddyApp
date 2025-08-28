import Link from 'next/link';
import museaData from '../musea.json';

export default function Home({ musea }) {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>MuseumBuddy</h1>
      <ul style={{ marginTop: 16 }}>
        {musea.map(m => (
          <li key={m.id} style={{ marginBottom: 8 }}>
            <Link href={`/museum/${m.id}`}>{m.title}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export async function getStaticProps() {
  const musea = Array.isArray(museaData) ? museaData : (museaData.musea || []);
  return { props: { musea } };
}
