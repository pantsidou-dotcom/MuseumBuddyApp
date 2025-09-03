import Link from 'next/link';
import Image from 'next/image';

export default function MuseumCard({ museum }) {
  // Guard against undefined museum data which previously caused build issues
  if (!museum) {
    return null;
  }

  return (
    <article className="museum-card">
      <div className="museum-card-image">
        <Link
          href={{ pathname: '/museum/[id]', query: { id: museum.id } }}
          style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}
          aria-label={`Bekijk ${museum.title}`}
        >
          {museum.image && (
            <Image
              src={museum.image.startsWith('/') ? museum.image : `/${museum.image}`}
              alt={museum.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          )}
        </Link>
        <div className="museum-card-actions">
          <button className="icon-button" aria-label="Deel">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
              <path d="M16 6l-4-4-4 4" />
              <path d="M12 2v14" />
            </svg>
          </button>
          <button className="icon-button" aria-label="Bewaar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="museum-card-info">
        <h3 className="museum-card-title">{museum.title}</h3>
        <p className="museum-card-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
            <path d="M12 21s-7.5-7.048-7.5-11.25a7.5 7.5 0 1 1 15 0C19.5 13.952 12 21 12 21Z" />
          </svg>
          {museum.title}, {museum.city}
        </p>
      </div>
    </article>
  );
}

