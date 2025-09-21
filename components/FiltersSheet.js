import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export const FILTERS_SHEET_ID = 'filters-sheet-panel';

function normalizeFilters(filters) {
  return filters || {};
}

function resolveSections(sections, labels) {
  if (Array.isArray(sections) && sections.length > 0) {
    return sections;
  }

  return [
    {
      id: 'availability',
      title: labels?.availability,
      options: [
        { name: 'free', label: labels?.free },
        { name: 'exhibitions', label: labels?.exhibitions },
      ],
    },
    {
      id: 'comingsoon',
      title: labels?.future,
      options: [
        { name: 'kidFriendly', label: labels?.kidFriendly, disabled: true, badge: labels?.comingSoon },
        { name: 'nearby', label: labels?.distance, disabled: true, badge: labels?.comingSoon },
      ],
      note: labels?.todo,
    },
  ];
}

export function FiltersForm({
  filters,
  onChange,
  onApply,
  onReset,
  labels,
  sections,
  idPrefix = 'filters-sheet',
}) {
  const normalizedFilters = useMemo(() => normalizeFilters(filters), [filters]);
  const computedSections = useMemo(() => resolveSections(sections, labels), [sections, labels]);

  return (
    <>
      <div className="filters-sheet__content">
        {computedSections.map((section) => {
          if (!section) return null;
          const sectionId = `${idPrefix}-${section.id}`;
          const options = Array.isArray(section.options) ? section.options : [];
          return (
            <section key={section.id || sectionId} className="filters-sheet__group" aria-labelledby={sectionId}>
              {section.title && (
                <h3 id={sectionId} className="filters-sheet__group-title">
                  {section.title}
                </h3>
              )}
              {options.map((option) => {
                if (!option) return null;
                const optionId = `${sectionId}-${option.name}`;
                const isDisabled = Boolean(option.disabled);
                const className = [
                  'filters-sheet__option',
                  isDisabled ? 'filters-sheet__option--disabled' : '',
                  option.className || '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <label key={option.name || optionId} className={className} htmlFor={optionId}>
                    <input
                      id={optionId}
                      type="checkbox"
                      checked={Boolean(normalizedFilters[option.name])}
                      disabled={isDisabled}
                      onChange={(event) => onChange?.(option.name, event.target.checked)}
                    />
                    {option.badge ? (
                      <div className="filters-sheet__option-text">
                        <span>{option.label}</span>
                        {option.badge && <span className="filters-sheet__badge">{option.badge}</span>}
                      </div>
                    ) : (
                      <span>{option.label}</span>
                    )}
                  </label>
                );
              })}
              {section.note && <p className="filters-sheet__todo">{section.note}</p>}
            </section>
          );
        })}
      </div>
      <footer className="filters-sheet__footer">
        <button type="button" className="filters-sheet__reset" onClick={onReset}>
          {labels?.reset}
        </button>
        <button type="button" className="filters-sheet__apply" onClick={onApply}>
          {labels?.apply}
        </button>
      </footer>
    </>
  );
}

export default function FiltersSheet({
  open = false,
  filters,
  onChange,
  onApply,
  onReset,
  onClose,
  labels,
  sections,
  idPrefix = 'filters-sheet',
}) {
  const [mounted, setMounted] = useState(false);
  const previousOverflow = useRef(null);
  const closeButtonRef = useRef(null);

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

  const headingId = `${idPrefix}-title`;
  const descriptionId = labels?.description ? `${idPrefix}-description` : undefined;

  const renderContent = () => (
    <div className={`filters-sheet${open ? ' filters-sheet--open' : ''}`} role="presentation">
      <div className="filters-sheet__backdrop" onClick={handleBackdropClick} />
      <div
        id={FILTERS_SHEET_ID}
        className="filters-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        aria-describedby={descriptionId}
      >
        <header className="filters-sheet__header">
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
          onApply={onApply}
          onReset={onReset}
          labels={labels}
          sections={sections}
          idPrefix={idPrefix}
        />
      </div>
    </div>
  );

  return createPortal(renderContent(), document.body);
}
