import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const FILTERS_SHEET_ID = 'filters-sheet-panel';

function normalizeFilters(filters) {
  return filters || {};
}

export default function FiltersSheet({
  open = false,
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
  labels,
}) {
  const [mounted, setMounted] = useState(false);
  const previousOverflow = useRef(null);
  const closeButtonRef = useRef(null);
  const normalizedFilters = useMemo(() => normalizeFilters(filters), [filters]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!mounted) return undefined;
    if (!open) return undefined;

    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow.current || '';
    };
  }, [mounted, open]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 150);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;

  const handleBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose?.();
    }
  };

  const renderContent = () => (
    <div className={`filters-sheet${open ? ' filters-sheet--open' : ''}`} role="presentation">
      <div className="filters-sheet__backdrop" onClick={handleBackdropClick} />
      <div
        id={FILTERS_SHEET_ID}
        className="filters-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="filters-sheet-title"
        aria-describedby="filters-sheet-description"
      >
        <header className="filters-sheet__header">
          <div className="filters-sheet__heading">
            <h2 id="filters-sheet-title" className="filters-sheet__title">
              {labels?.title}
            </h2>
            {labels?.description && (
              <p id="filters-sheet-description" className="filters-sheet__description">
                {labels.description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="filters-sheet__close"
            onClick={onClose}
            aria-label={labels?.close}
            ref={closeButtonRef}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6l12 12M18 6L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </header>
        <div className="filters-sheet__content">
          <section className="filters-sheet__group" aria-labelledby="filters-section-availability">
            <h3 id="filters-section-availability" className="filters-sheet__group-title">
              {labels?.availability}
            </h3>
            <label className="filters-sheet__option">
              <input
                type="checkbox"
                checked={Boolean(normalizedFilters.free)}
                onChange={(event) => onChange?.('free', event.target.checked)}
              />
              <span>{labels?.free}</span>
            </label>
            <label className="filters-sheet__option">
              <input
                type="checkbox"
                checked={Boolean(normalizedFilters.exhibitions)}
                onChange={(event) => onChange?.('exhibitions', event.target.checked)}
              />
              <span>{labels?.exhibitions}</span>
            </label>
          </section>
          <section className="filters-sheet__group" aria-labelledby="filters-section-comingsoon">
            <h3 id="filters-section-comingsoon" className="filters-sheet__group-title">
              {labels?.future}
            </h3>
            <label className="filters-sheet__option filters-sheet__option--disabled">
              <input type="checkbox" checked={Boolean(normalizedFilters.kidFriendly)} disabled />
              <div className="filters-sheet__option-text">
                <span>{labels?.kidFriendly}</span>
                {labels?.comingSoon && <span className="filters-sheet__badge">{labels.comingSoon}</span>}
              </div>
            </label>
            <label className="filters-sheet__option filters-sheet__option--disabled">
              <input type="checkbox" checked={Boolean(normalizedFilters.nearby)} disabled />
              <div className="filters-sheet__option-text">
                <span>{labels?.distance}</span>
                {labels?.comingSoon && <span className="filters-sheet__badge">{labels.comingSoon}</span>}
              </div>
            </label>
            {labels?.todo && <p className="filters-sheet__todo">{labels.todo}</p>}
          </section>
        </div>
        <footer className="filters-sheet__footer">
          <button type="button" className="filters-sheet__reset" onClick={onReset}>
            {labels?.reset}
          </button>
          <button type="button" className="filters-sheet__apply" onClick={onApply}>
            {labels?.apply}
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(renderContent(), document.body);
}
