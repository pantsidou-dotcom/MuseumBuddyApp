import { useCallback, useEffect, useId, useRef, useState } from 'react';

export default function TicketButtonAffiliateInfo({ infoMessage, className = '' }) {
  const infoRef = useRef(null);
  const tooltipId = useId();
  const [isTooltipPinned, setTooltipPinned] = useState(false);
  const hasInfo = Boolean(infoMessage);

  const handleInfoToggle = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!hasInfo) {
        return;
      }

      setTooltipPinned((value) => !value);
    },
    [hasInfo]
  );

  const handleInfoKeyDown = useCallback(
    (event) => {
      if (!hasInfo) {
        return;
      }

      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        setTooltipPinned((value) => !value);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        setTooltipPinned(false);
      }
    },
    [hasInfo]
  );

  useEffect(() => {
    if (!hasInfo || !isTooltipPinned) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!infoRef.current) {
        return;
      }

      if (!infoRef.current.contains(event.target)) {
        setTooltipPinned(false);
      }
    };

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setTooltipPinned(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleDocumentKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleDocumentKeyDown);
    };
  }, [hasInfo, isTooltipPinned]);

  if (!hasInfo) {
    return null;
  }

  const groupClassName = className
    ? `ticket-button__affiliate-info-group ${className}`
    : 'ticket-button__affiliate-info-group';

  return (
    <span className={groupClassName} ref={infoRef}>
      <span
        className="ticket-button__affiliate-info"
        role="button"
        tabIndex={0}
        aria-haspopup="true"
        aria-controls={tooltipId}
        aria-expanded={isTooltipPinned}
        aria-pressed={isTooltipPinned}
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
        data-visible={isTooltipPinned ? 'true' : undefined}
      >
        {infoMessage}
      </span>
    </span>
  );
}
