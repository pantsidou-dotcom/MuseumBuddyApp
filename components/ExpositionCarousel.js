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
  autoPlay = true,
  autoPlayInterval = 8000,
}) {
  const slides = useMemo(() => (Array.isArray(items) ? items.filter(Boolean) : []), [items]);
  const totalSlides = slides.length;
  const viewportRef = useRef(null);
  const [isScrollable, setIsScrollable] = useState(false);
  const isControlled = typeof controlledActiveSlide === 'number' && !Number.isNaN(controlledActiveSlide);
  const getSafeIndex = useCallback(
    (index) => {
      if (!totalSlides) return 0;
      return clamp(index, 0, totalSlides - 1);
    },
    [totalSlides]
  );
  const [uncontrolledActive, setUncontrolledActive] = useState(() => getSafeIndex(initialActiveSlide));
  const {
    previous,
    next,
    pagination,
    goToSlide: gotoSlideLabel,
    slide: slideLabel,
    instructions,
    pause,
    play,
    autoplayPaused,
    autoplayPlaying,
  } = useMemo(
    () => ({
      previous: 'Scroll to previous slide',
      next: 'Scroll to next slide',
      pagination: 'Slides',
      instructions:
        'Use the arrow keys to browse slides. Press Home to jump to the first slide and End to go to the last slide. Use the pause button to stop autoplay.',
      pause: 'Pause carousel autoplay',
      play: 'Resume carousel autoplay',
      autoplayPaused: 'Carousel autoplay paused',
      autoplayPlaying: 'Carousel autoplay playing',
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

    const handleWheel = (event) => {
      if (!viewport) return;
      if (event.ctrlKey) return;
      const isScrollable = viewport.scrollWidth - viewport.clientWidth > 1;
      if (!isScrollable) return;

      const { deltaX = 0, deltaY = 0 } = event;
      if (Math.abs(deltaY) <= Math.abs(deltaX)) return;

      event.preventDefault();
      viewport.scrollBy({
        left: deltaY,
        behavior: 'smooth',
      });
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      viewport.removeEventListener('wheel', handleWheel);
    };
  }, [totalSlides]);

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

  const carouselId = useId();
  const viewportId = `${carouselId}-viewport`;
  const trackId = `${carouselId}-track`;
  const instructionsId = `${carouselId}-instructions`;
  const liveRegionId = `${carouselId}-live-region`;
  const autoplayStatusId = `${carouselId}-autoplay-status`;
  const showControls = totalSlides > 1 && isScrollable;
  const [isPaused, setIsPaused] = useState(() => !autoPlay);
  const instructionsText = useMemo(() => {
    if (typeof instructions === 'function') {
      return instructions(totalSlides);
    }
    return instructions;
  }, [instructions, totalSlides]);
  const describedBy = useMemo(() => {
    const ids = [];
    if (instructionsText) ids.push(instructionsId);
    if (showControls) ids.push(liveRegionId);
    if (showControls && autoPlay) ids.push(autoplayStatusId);
    return ids.join(' ');
  }, [autoPlay, autoplayStatusId, instructionsId, instructionsText, liveRegionId, showControls]);
  const controlledIds = useMemo(
    () =>
      [viewportId, trackId]
        .filter(Boolean)
        .join(' ') || undefined,
    [trackId, viewportId]
  );
  const [liveAnnouncement, setLiveAnnouncement] = useState(() => {
    if (!showControls) {
      return '';
    }
    return getSlideLabel(activeSlide);
  });
  const [autoplayAnnouncement, setAutoplayAnnouncement] = useState('');

  const updateScrollableState = useCallback(() => {
    if (totalSlides <= 1) {
      setIsScrollable(false);
      return;
    }
    const element = viewportRef.current;
    if (!element) {
      setIsScrollable(false);
      return;
    }
    const tolerance = 1;
    const hasOverflow = element.scrollWidth - element.clientWidth > tolerance;
    setIsScrollable(hasOverflow);
  }, [totalSlides]);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) {
      setIsScrollable(false);
      return undefined;
    }

    updateScrollableState();

    window.addEventListener('resize', updateScrollableState);

    let observer;
    if (typeof ResizeObserver === 'function') {
      observer = new ResizeObserver(() => {
        updateScrollableState();
      });
      observer.observe(element);
      const trackNode = element.querySelector('.exposition-carousel__track');
      if (trackNode) {
        observer.observe(trackNode);
      }
    }

    return () => {
      window.removeEventListener('resize', updateScrollableState);
      if (observer) {
        observer.disconnect();
      }
    };
  }, [slides, updateScrollableState]);

  const pauseAutoplay = useCallback(() => {
    if (!autoPlay) return;
    setIsPaused(true);
  }, [autoPlay]);

  const handleTogglePause = useCallback(() => {
    if (!autoPlay) return;
    setIsPaused((previous) => !previous);
  }, [autoPlay]);

  const handlePrev = useCallback(() => {
    pauseAutoplay();
    updateActiveSlide(activeSlide - 1);
  }, [activeSlide, pauseAutoplay, updateActiveSlide]);

  const handleNext = useCallback(() => {
    pauseAutoplay();
    updateActiveSlide(activeSlide + 1);
  }, [activeSlide, pauseAutoplay, updateActiveSlide]);

  const handleViewportKeyDown = useCallback(
    (event) => {
      if (totalSlides <= 1 || !isScrollable) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        pauseAutoplay();
        updateActiveSlide(activeSlide + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        pauseAutoplay();
        updateActiveSlide(activeSlide - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        pauseAutoplay();
        updateActiveSlide(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        pauseAutoplay();
        updateActiveSlide(totalSlides - 1);
      }
    },
    [activeSlide, isScrollable, pauseAutoplay, totalSlides, updateActiveSlide]
  );

  useEffect(() => {
    if (!showControls) {
      setLiveAnnouncement('');
      return;
    }
    const nextAnnouncement = getSlideLabel(activeSlide);
    setLiveAnnouncement((previous) => (previous === nextAnnouncement ? previous : nextAnnouncement));
  }, [activeSlide, getSlideLabel, showControls]);

  useEffect(() => {
    if (!autoPlay) return undefined;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      setIsPaused(true);
    }
    const handleChange = (event) => {
      if (event.matches) {
        setIsPaused(true);
      }
    };
    media.addEventListener('change', handleChange);
    return () => {
      media.removeEventListener('change', handleChange);
    };
  }, [autoPlay]);

  useEffect(() => {
    if (!autoPlay || isPaused || !showControls) return undefined;
    if (typeof window === 'undefined') return undefined;
    const timer = window.setInterval(() => {
      const nextIndex = activeSlide + 1 >= totalSlides ? 0 : activeSlide + 1;
      updateActiveSlide(nextIndex);
    }, autoPlayInterval);
    return () => {
      window.clearInterval(timer);
    };
  }, [activeSlide, autoPlay, autoPlayInterval, isPaused, showControls, totalSlides, updateActiveSlide]);

  useEffect(() => {
    if (!autoPlay || !showControls) {
      setAutoplayAnnouncement('');
      return;
    }
    const statusText = isPaused ? autoplayPaused : autoplayPlaying;
    setAutoplayAnnouncement(statusText || '');
  }, [autoPlay, autoplayPaused, autoplayPlaying, isPaused, showControls]);

  const regionLabel = typeof ariaLabel === 'string' && ariaLabel.trim() ? ariaLabel : 'Carousel';

  if (!totalSlides) {
    return null;
  }

  return (
    <div
      className="exposition-carousel"
      role="region"
      aria-label={regionLabel}
      aria-roledescription="carousel"
      aria-controls={controlledIds}
    >
      {instructionsText ? (
        <p id={instructionsId} className="sr-only">
          {instructionsText}
        </p>
      ) : null}
      {showControls ? (
        <p id={liveRegionId} className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {liveAnnouncement}
        </p>
      ) : null}
      {showControls && autoPlay ? (
        <p id={autoplayStatusId} className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {autoplayAnnouncement}
        </p>
      ) : null}
      <div
        className="exposition-carousel__viewport"
        ref={viewportRef}
        id={viewportId}
        tabIndex={0}
        onKeyDown={handleViewportKeyDown}
        onPointerDown={pauseAutoplay}
        onFocus={pauseAutoplay}
        aria-describedby={describedBy || undefined}
      >
        <ul className="exposition-carousel__track" role="list" id={trackId}>
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
      {showControls && (
        <>
          <div className="exposition-carousel__navigation">
            <button
              type="button"
              className="exposition-carousel__arrow exposition-carousel__arrow--prev"
              onClick={handlePrev}
              aria-controls={controlledIds}
              aria-label={previous}
              disabled={activeSlide === 0}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="exposition-carousel__arrow exposition-carousel__arrow--next"
              onClick={handleNext}
              aria-controls={controlledIds}
              aria-label={next}
              disabled={activeSlide === totalSlides - 1}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
          <div className="exposition-carousel__controls">
            {autoPlay ? (
              <button
                type="button"
                className={`exposition-carousel__pause${isPaused ? ' is-paused' : ''}`}
                onClick={handleTogglePause}
                aria-pressed={isPaused}
              >
                <span className="exposition-carousel__pause-icon" aria-hidden="true">
                  {isPaused ? '▶' : '❚❚'}
                </span>
                <span className="exposition-carousel__pause-label">{isPaused ? play : pause}</span>
              </button>
            ) : null}
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
                    aria-controls={controlledIds}
                    className={`exposition-carousel__dot${isActive ? ' is-active' : ''}`}
                    onClick={() => {
                      pauseAutoplay();
                      updateActiveSlide(index);
                    }}
                    aria-label={getGotoSlideLabel(index)}
                  >
                    <span aria-hidden="true" />
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
