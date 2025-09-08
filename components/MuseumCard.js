import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MuseumCard({ museum }) {
  if (!museum) return null;

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]');
      setIsFavorite(stored.includes(museum.id));
    } catch {
      // ignore
    }
  }, [museum.id]);

  const toggleFavorite = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem('favorites') || '[]');
      const exists = stored.includes(museum.id);
      const next = exists
        ? stored.filter((id) => id !== museum.id)
        : [...stored, museum.id];

      localStorage.setItem('favorites', JSON.stringify(next));
      setIsFavorite(!exists);
    } catch {
      // ignore
    }
  };

  const shareMuseum = async () => {
    if (typeof window === 'undefined') return;

    const url = `${window.location.origin}/museum/${museum.slug}`;
    const shareData = {
      title: museum.title,
      text: `Bekijk ${museum.title}`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // ignore
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link gekopieerd naar klembord');
        return;
      } catch {
        // ignore
      }
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.prompt('Kopieer deze link', url);
    }
  };

  return (
    <article className="museum-card">
      <div className="museum-card-image">
        <Link
          href={{ pathname: '/museum/[slug]', query: { slug: museum.slug } }}
          style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}
          aria-label={`Bekijk ${museum.title}`}
        >
          {museum.image && (
            <img
              src={museum.image}
              alt={museum.title}
              loading="lazy"
              style={{ objectFit: 'cover', width: '100%', height: '100%' }}
            />
          )}
        </Link>
        <div className="museum-card-actions">
          <button className="icon-button" aria-label="Deel" onClick={shareMuseum}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
              <path d="M16 6l-4-4-4 4" />
              <path d="M12 2v14" />
            </svg>
          </button>
          <button
            className={`icon-button${isFavorite ? ' favorited' : ''}`}
            aria-label="Bewaar"
            aria-pressed={isFavorite}
            onClick={toggleFavorite}
          >
            <svg
              viewBox="0 0 24 24"
              fill={isFavorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="museum-card-info">
        <h3 className="museum-card-title">{museum.title}</h3>
        <p className="museum-card-location">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
            <path d="M12 21s-7.5-7.048-7.5-11.25a7.5 7.5 0 1 1 15 0C19.5 13.952 12 21 12 21Z" />
          </svg>
          {[museum.city, museum.province].filter(Boolean).join(', ')}
        </p>
        {(museum.free || museum.kids) && (
          <div className="museum-card-tags">
            {museum.free && <span className="tag">Gratis</span>}
            {museum.kids && <span className="tag">Kids</span>}
          </div>
        )}
      </div>
    </article>
  );
}
