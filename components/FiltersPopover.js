import { useEffect, useMemo, useRef } from 'react';
import { FiltersForm } from './FiltersSheet';

export default function FiltersPopover({
  open = false,
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
  labels,
  sections,
  triggerRef,
  idPrefix = 'filters-popover',
}) {
  const popoverRef = useRef(null);
  const closeButtonRef = useRef(null);

  const headingId = `${idPrefix}-title`;
  const descriptionId = labels?.description ? `${idPrefix}-description` : undefined;

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!popoverRef.current) return;
      if (popoverRef.current.contains(event.target)) return;
      if (triggerRef?.current && triggerRef.current.contains(event.target)) return;
      onClose?.();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, triggerRef]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 100);
    return () => window.clearTimeout(timer);
  }, [open]);

  const className = useMemo(
    () => `filters-popover${open ? ' filters-popover--open' : ''}`,
    [open]
  );

  if (!open) {
    return null;
  }

  return (
    <div
      ref={popoverRef}
      className={className}
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <header className="filters-sheet__header filters-popover__header">
        <div className="filters-sheet__heading">
          <h2 id={headingId} className="filters-sheet__title">
            {labels?.title}
          </h2>
          {labels?.description && (
            <p id={descriptionId} className="filters-sheet__description">
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
      <FiltersForm
        filters={filters}
        onChange={onChange}
        onApply={() => {
          onApply?.();
        }}
        onReset={() => {
          onReset?.();
        }}
        labels={labels}
        sections={sections}
        idPrefix={idPrefix}
      />
    </div>
  );
}
