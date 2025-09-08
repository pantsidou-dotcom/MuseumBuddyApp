import { useEffect, useState } from 'react';

export default function ExpositionCard({ exposition, status, periode }) {
  if (!exposition) return null;

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem('favoriteExpositions') || '[]');
      setIsFavorite(stored.includes(exposition.id));
    } catch {
      // ignore
    }
  }, [exposition.id]);

  const toggleFavorite = () => {
    if (typeof window === 'undefined') return;
    try {
      const stored = JSON.parse(localStorage.getItem('favoriteExpositions') || '[]');
      const exists = stored.includes(exposition.id);
      const next = exists ? stored.filter((id) => id !== exposition.id) : [...stored, exposition.id];
      localStorage.setItem('favoriteExpositions', JSON.stringify(next));
      setIsFavorite(!exists);
    } catch {
      // ignore
    }
  };

  const shareExposition = async () => {
    if (typeof window === 'undefined') return;

    const url = exposition.bron_url || window.location.href;
    const shareData = {
      title: exposition.titel,
      text: exposition.titel,
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
        {exposition.bron_url ? (
          <a
            href={exposition.bron_url}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'block', width: '100%', height: '100%' }}
          >
            <div style={{ width: '100%', height: '100%', background: '#ddd' }} />
          </a>
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#ddd' }} />
        )}
        <div className="museum-card-actions">
          <button className="icon-button" aria-label="Deel" onClick={shareExposition}>
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
        <h3 className="museum-card-title">
          {exposition.bron_url ? (
            <a href={exposition.bron_url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
              {exposition.titel}
            </a>
          ) : (
            exposition.titel
          )}
        </h3>
        {periode && <p className="museum-card-location">{periode}</p>}
        {status && (
          <div className="museum-card-tags">
            <span className="tag">{status}</span>
          </div>
        )}
      </div>
    </article>
  );
}

