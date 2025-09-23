import { useCallback, useEffect, useId, useRef, useState } from 'react';

export default function TicketButtonNote({
  affiliate = false,
  showIcon = true,
  infoMessage,
  children,
  id,
}) {
  const noteRef = useRef(null);
  const tooltipId = useId();
  const [isTooltipPinned, setTooltipPinned] = useState(false);

  const shouldShowIcon = affiliate || showIcon;
  const shouldShowInfo = Boolean(affiliate && infoMessage);
  const noteClassName = `ticket-button__note${affiliate ? ' ticket-button__note--partner' : ''}`;

  const handleInfoToggle = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setTooltipPinned((value) => !value);
  }, []);

  const handleInfoKeyDown = useCallback((event) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      setTooltipPinned((value) => !value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      setTooltipPinned(false);
    }
  }, []);

  useEffect(() => {
    if (!isTooltipPinned) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!noteRef.current) {
        return;
      }

      if (!noteRef.current.contains(event.target)) {
        setTooltipPinned(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [isTooltipPinned]);

  if (!children) {
    return null;
  }

  return (
    <span className={noteClassName} id={id} ref={noteRef}>
      {shouldShowIcon ? (
        <svg
          className="ticket-button__note-icon"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M11.25 2.75h6v6" />
          <path d="M17.25 2.75 9.5 10.5" />
          <path d="M6.5 5.5H2.75v11.75h11.75V13" />
        </svg>
      ) : null}
      <span className="ticket-button__note-text">{children}</span>
      {shouldShowInfo ? (
        <span className="ticket-button__affiliate-info-group">
          <span
            className="ticket-button__affiliate-info"
            role="button"
            tabIndex={0}
            aria-haspopup="true"
            aria-controls={tooltipId}
            aria-expanded={isTooltipPinned}
            aria-label={infoMessage}
            onClick={handleInfoToggle}
            onKeyDown={handleInfoKeyDown}
          >
            <svg
              className="ticket-button__affiliate-info-icon"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="10" cy="10" r="7.25" />
              <path d="M10 9.25v4" />
              <circle cx="10" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span
            id={tooltipId}
            role="tooltip"
            className="ticket-button__affiliate-tooltip"
            aria-hidden={!isTooltipPinned}
            data-visible={isTooltipPinned ? 'true' : undefined}
          >
            {infoMessage}
          </span>
        </span>
      ) : null}
    </span>
  );
}
