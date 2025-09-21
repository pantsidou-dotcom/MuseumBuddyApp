import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

function clamp(value, min, max) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export default function ExpositionCarousel({
  items = [],
  renderItem,
  ariaLabel,
  activeSlide: controlledActiveSlide,
  onActiveSlideChange,
  initialActiveSlide = 0,
  getItemKey,
  labels = {},
}) {
  const slides = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
  const totalSlides = slides.length;
  const viewportRef = useRef(null);
  const isControlled = typeof controlledActiveSlide === 'number' && !Number.isNaN(controlledActiveSlide);
  const getSafeIndex = useCallback(
    (index) => {
      if (!totalSlides) return 0;
      return clamp(index, 0, totalSlides - 1);
    },
    [totalSlides]
  );
  const [uncontrolledActive, setUncontrolledActive] = useState(() => getSafeIndex(initialActiveSlide));
  const { previous, next, pagination, goToSlide: gotoSlideLabel, slide: slideLabel } = useMemo(
    () => ({
      previous: 'Scroll to previous slide',
      next: 'Scroll to next slide',
      pagination: 'Slides',
      ...labels,
    }),
    [labels]
  );
  const activeSlide = useMemo(
    () => (isControlled ? getSafeIndex(controlledActiveSlide) : getSafeIndex(uncontrolledActive)),
    [controlledActiveSlide, getSafeIndex, isControlled, uncontrolledActive]
  );

  useEffect(() => {
    if (!isControlled) {
      setUncontrolledActive((previous) => getSafeIndex(previous));
    }
  }, [getSafeIndex, isControlled, totalSlides]);

  const updateActiveSlide = useCallback(
    (index) => {
      if (!totalSlides) return;
      const nextIndex = getSafeIndex(index);
      if (!isControlled) {
        setUncontrolledActive(nextIndex);
      }
      if (typeof onActiveSlideChange === 'function') {
        onActiveSlideChange(nextIndex);
      }
    },
    [getSafeIndex, isControlled, onActiveSlideChange, totalSlides]
  );

  const scrollToActiveSlide = useCallback(
    (index) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const slideNodes = viewport.querySelectorAll('[data-carousel-slide="true"]');
      const target = slideNodes[index];
      if (!target) return;
      try {
        target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      } catch (err) {
        const { offsetLeft } = target;
        viewport.scrollTo({ left: offsetLeft, behavior: 'smooth' });
      }
    },
    []
  );

  useEffect(() => {
    if (!totalSlides) return;
    scrollToActiveSlide(activeSlide);
  }, [activeSlide, scrollToActiveSlide, totalSlides]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || totalSlides <= 1) return undefined;
    let frame = null;

    const handleScroll = () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      frame = window.requestAnimationFrame(() => {
        const slideNodes = viewport.querySelectorAll('[data-carousel-slide="true"]');
        if (!slideNodes.length) return;
        const viewportRect = viewport.getBoundingClientRect();
        const viewportCenter = viewportRect.left + viewportRect.width / 2;
        let closestIndex = 0;
        let smallestDistance = Infinity;
        slideNodes.forEach((node, index) => {
          const rect = node.getBoundingClientRect();
          const slideCenter = rect.left + rect.width / 2;
          const distance = Math.abs(slideCenter - viewportCenter);
          if (distance < smallestDistance) {
            smallestDistance = distance;
            closestIndex = index;
          }
        });
        if (!isControlled && closestIndex !== uncontrolledActive) {
          setUncontrolledActive(closestIndex);
        }
        if (typeof onActiveSlideChange === 'function' && closestIndex !== activeSlide) {
          onActiveSlideChange(closestIndex);
        }
      });
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      if (frame) {
        cancelAnimationFrame(frame);
      }
    };
  }, [activeSlide, isControlled, onActiveSlideChange, totalSlides, uncontrolledActive]);

  const getSlideLabel = useCallback(
    (index) => {
      if (typeof slideLabel === 'function') {
        return slideLabel(index + 1, totalSlides);
      }
      if (typeof slideLabel === 'string') {
        return slideLabel;
      }
      return `${index + 1} / ${totalSlides}`;
    },
    [slideLabel, totalSlides]
  );

  const getGotoSlideLabel = useCallback(
    (index) => {
      if (typeof gotoSlideLabel === 'function') {
        return gotoSlideLabel(index + 1, totalSlides);
      }
      if (typeof gotoSlideLabel === 'string') {
        return gotoSlideLabel;
      }
      return `Go to slide ${index + 1}`;
    },
    [gotoSlideLabel, totalSlides]
  );

  const handlePrev = useCallback(() => {
    updateActiveSlide(activeSlide - 1);
  }, [activeSlide, updateActiveSlide]);

  const handleNext = useCallback(() => {
    updateActiveSlide(activeSlide + 1);
  }, [activeSlide, updateActiveSlide]);

  const handleViewportKeyDown = useCallback(
    (event) => {
      if (totalSlides <= 1) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        updateActiveSlide(activeSlide + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        updateActiveSlide(activeSlide - 1);
      }
    },
    [activeSlide, totalSlides, updateActiveSlide]
  );

  const carouselId = useId();
  const viewportId = `${carouselId}-viewport`;

  if (!totalSlides) {
    return null;
  }

  return (
    <div className="exposition-carousel" role="region" aria-label={ariaLabel}>
      <div
        className="exposition-carousel__viewport"
        ref={viewportRef}
        id={viewportId}
        tabIndex={0}
        onKeyDown={handleViewportKeyDown}
        aria-roledescription="carousel"
      >
        <ul className="exposition-carousel__track" role="list">
          {slides.map((item, index) => {
            const key = typeof getItemKey === 'function' ? getItemKey(item, index) : item?.id ?? index;
            const isActive = index === activeSlide;
            return (
              <li
                key={key}
                className={`exposition-carousel__slide${isActive ? ' is-active' : ''}`}
                data-carousel-slide="true"
                role="group"
                aria-roledescription="slide"
                aria-label={getSlideLabel(index)}
                aria-current={isActive ? 'true' : undefined}
              >
                {typeof renderItem === 'function' ? renderItem(item, index, isActive) : item}
              </li>
            );
          })}
        </ul>
      </div>
      {totalSlides > 1 && (
        <>
          <div className="exposition-carousel__navigation">
            <button
              type="button"
              className="exposition-carousel__arrow exposition-carousel__arrow--prev"
              onClick={handlePrev}
              aria-controls={viewportId}
              aria-label={previous}
              disabled={activeSlide === 0}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="exposition-carousel__arrow exposition-carousel__arrow--next"
              onClick={handleNext}
              aria-controls={viewportId}
              aria-label={next}
              disabled={activeSlide === totalSlides - 1}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
          <div className="exposition-carousel__pagination" role="tablist" aria-label={pagination}>
            {slides.map((item, index) => {
              const isActive = index === activeSlide;
              const key = typeof getItemKey === 'function' ? getItemKey(item, index) : item?.id ?? index;
              return (
                <button
                  key={`indicator-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={viewportId}
                  className={`exposition-carousel__dot${isActive ? ' is-active' : ''}`}
                  onClick={() => updateActiveSlide(index)}
                  aria-label={getGotoSlideLabel(index)}
                >
                  <span aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
