import { useLanguage } from './LanguageContext';
import { useFavorites } from './FavoritesContext';
import { shouldShowAffiliateNote } from '../lib/nonAffiliateMuseums';

function formatRange(start, end, locale) {
  if (!start) return '';
  const opts = { day: '2-digit', month: 'short' };
  const startFmt = start.toLocaleDateString(locale, opts).toUpperCase();
  if (!end) return startFmt;
  const endFmt = end.toLocaleDateString(locale, opts).toUpperCase();
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const month = startFmt.split(' ')[1];
    return `${start.getDate().toString().padStart(2, '0')} - ${end
      .getDate()
      .toString()
      .padStart(2, '0')} ${month}`;
  }
  return `${startFmt} - ${endFmt}`;
}

export default function ExpositionCard({ exposition, ticketUrl, museumSlug }) {
  if (!exposition) return null;

  const start = exposition.start_datum ? new Date(exposition.start_datum + 'T00:00:00') : null;
  const end = exposition.eind_datum ? new Date(exposition.eind_datum + 'T00:00:00') : null;
  const { lang, t } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const locale = lang === 'en' ? 'en-US' : 'nl-NL';
  const rangeLabel = formatRange(start, end, locale);
  const isFavorite = favorites.some((f) => f.id === exposition.id && f.type === 'exposition');
  const buyUrl = ticketUrl || exposition.ticketUrl || exposition.bron_url;
  const slug = museumSlug || exposition.museumSlug;
  const showAffiliateNote = Boolean(buyUrl) && (!slug || shouldShowAffiliateNote(slug));

  const handleFavorite = () => {
    toggleFavorite({
      id: exposition.id,
      titel: exposition.titel,
      start_datum: exposition.start_datum,
      eind_datum: exposition.eind_datum,
      bron_url: exposition.bron_url,
      ticketUrl: buyUrl,
      museumSlug: slug,
      type: 'exposition',
    });
  };

  return (
    <article className="event-card exposition-card">
      <div className="event-card-date">
        {rangeLabel && <span className="event-card-status">{t('duration')}</span>}
        {rangeLabel && <span className="event-card-range">{rangeLabel}</span>}
      </div>
      <div className="event-card-info">
        <h3 className="event-card-title">
          {exposition.bron_url ? (
            <a href={exposition.bron_url} target="_blank" rel="noreferrer">
              {exposition.titel}
            </a>
          ) : (
            exposition.titel
          )}
        </h3>
      </div>
      <div className="event-card-actions">
        {buyUrl ? (
          <a
            href={buyUrl}
            target="_blank"
            rel="noreferrer"
            className="ticket-button"
            title={t('affiliateLink')}
          >
            <span>{t('buyTicket')}</span>
            {showAffiliateNote && <span className="affiliate-note">{t('affiliateLinkLabel')}</span>}
          </a>
        ) : (
          <button type="button" className="ticket-button" disabled aria-disabled="true">
            <span>{t('buyTicket')}</span>
          </button>
        )}
        <button
          className={`icon-button large${isFavorite ? ' favorited' : ''}`}
          aria-label={t('save')}
          aria-pressed={isFavorite}
          onClick={handleFavorite}
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
    </article>
  );
}

