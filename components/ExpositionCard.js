function formatRange(start, end) {
  if (!start) return '';
  const opts = { day: '2-digit', month: 'short' };
  const startFmt = start.toLocaleDateString('en-US', opts).toUpperCase();
  if (!end) return startFmt;
  const endFmt = end.toLocaleDateString('en-US', opts).toUpperCase();
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

export default function ExpositionCard({ exposition, status, periode }) {
  if (!exposition) return null;

  const start = exposition.start_datum ? new Date(exposition.start_datum + 'T00:00:00') : null;
  const end = exposition.eind_datum ? new Date(exposition.eind_datum + 'T00:00:00') : null;
  const rangeLabel = formatRange(start, end);

  return (
    <article className="event-card exposition-card">
      <div className="event-card-date">
        {status === 'Loopt nu' && <span className="event-card-status">TODAY</span>}
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
        {periode && <p className="event-card-period">{periode}</p>}
      </div>
      <div className="event-card-actions">
        <a
          href={exposition.bron_url || '#'}
          target="_blank"
          rel="noreferrer"
          className="ticket-button"
          aria-disabled={!exposition.bron_url}
        >
          Ticket Kopen
        </a>
      </div>
    </article>
  );
}

