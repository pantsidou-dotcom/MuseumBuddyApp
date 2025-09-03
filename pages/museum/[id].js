import Link from 'next/link';
import Image from 'next/image';
import museaData from '../../musea.json';

export default function MuseumPage({ museum }) {
  if (!museum) {
    return (
      <>
        <p><Link className="backlink" href="/">&larr; Terug naar overzicht</Link></p>
        <h1 className="detail-title">Museum niet gevonden</h1>
        <p className="detail-sub">Controleer de link of ga terug naar het overzicht.</p>
      </>
    );
  }

  return (
    <>
      <p><Link className="backlink" href="/">&larr; Terug naar overzicht</Link></p>
      <h1 className="detail-title">{museum.title}</h1>
      <p className="detail-sub">{museum.city}</p>

    {museum.image && (
      <div className="hero">
        <Image
          src={museum.image.startsWith('/') ? museum.image : `/${museum.image}`}
          alt={museum.title}
          fill
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
      </div>
    )}
      {museum.description && (
        <p className="description" style={{ marginTop: 16 }}>
          {museum.description}
        </p>
      )}

      {museum.url && (
        <p style={{ marginTop: 16 }}>
          <a className="link-accent" href={museum.url} target="_blank" rel="noreferrer">Website openen</a>
        </p>
      )}
    </>
  );
}

export async function getStaticPaths() {
  const items = Array.isArray(museaData) ? museaData : (museaData.musea || []);
  const paths = items.filter(m => m && m.id != null).map(m => ({ params: { id: String(m.id) } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const items = Array.isArray(museaData) ? museaData : (museaData.musea || []);
  const museum = items.find(m => String(m.id) === String(params.id)) || null;
  return { props: { museum } };
}
