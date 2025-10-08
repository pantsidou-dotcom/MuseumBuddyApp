import Image from 'next/image';
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useFavorites } from './FavoritesContext';
import { useLanguage } from './LanguageContext';
import museumSummaries from '../lib/museumSummaries';
import museumOpeningHours from '../lib/museumOpeningHours';
import { CATEGORY_TRANSLATION_KEYS } from '../lib/museumCategories';
import { shouldShowAffiliateNote } from '../lib/nonAffiliateMuseums';
import formatImageCredit from '../lib/formatImageCredit';
import { normalizeImageSource, resolveImageUrl } from '../lib/resolveImageSource';
import createBlurDataUrl from '../lib/createBlurDataUrl';
import TicketButtonNote from './TicketButtonNote';
import Badge from './ui/Badge';

const HOVER_COLORS = ['#A7D8F0', '#77DDDD', '#F7C59F', '#D8BFD8', '#EAE0C8'];
const LOCAL_TIME_ZONE = 'Europe/Amsterdam';

function hashKey(value) {
  if (!value) return 0;
  const str = String(value);
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getHoverColor(slug, id) {
  const key = slug || (typeof id !== 'undefined' ? String(id) : '');
  if (!key) {
    return HOVER_COLORS[0];
  }
  const index = hashKey(key) % HOVER_COLORS.length;
  return HOVER_COLORS[index];
}

function parseTime(value) {
  if (!value || typeof value !== 'string') return null;
  const normalised = value.trim().replace('.', ':');
  const [hoursPart, minutesPart] = normalised.split(':');
  const hours = Number.parseInt(hoursPart, 10);
  const minutes = Number.parseInt(minutesPart, 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  if (hours < 0 || hours > 29) return null;
  if (minutes < 0 || minutes > 59) return null;
  const total = hours * 60 + minutes;
  return {
    minutes: total,
    label: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
  };
}

function getLocalMinutes(timeZone = LOCAL_TIME_ZONE) {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(new Date());
    const hourPart = parts.find((part) => part.type === 'hour');
    const minutePart = parts.find((part) => part.type === 'minute');
    const hours = hourPart ? Number.parseInt(hourPart.value, 10) : NaN;
    const minutes = minutePart ? Number.parseInt(minutePart.value, 10) : NaN;
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      return hours * 60 + minutes;
    }
  } catch (err) {
    // ignore and fallback to local time
  }
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function resolveOpeningStatus(hoursText, t) {
  if (!hoursText) return null;

  const timeMatch = hoursText.match(/(\d{1,2}[:.]\d{2})\s*[–-]\s*(\d{1,2}[:.]\d{2})/);
  if (!timeMatch) {
    return {
      text: hoursText,
      state: 'unknown',
      fallback: true,
    };
  }

  const start = parseTime(timeMatch[1]);
  const end = parseTime(timeMatch[2]);

  if (!start || !end) {
    return {
      text: hoursText,
      state: 'unknown',
      fallback: true,
    };
  }

  let startMinutes = start.minutes;
  let endMinutes = end.minutes;
  let crossesMidnight = false;

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
    crossesMidnight = true;
  }

  const nowMinutesBase = getLocalMinutes();
  const nowMinutes = crossesMidnight && nowMinutesBase < startMinutes ? nowMinutesBase + 24 * 60 : nowMinutesBase;
  const isOpen = nowMinutes >= startMinutes && nowMinutes < endMinutes;
  const rangeLabel = `${start.label}–${end.label}`;

  if (isOpen) {
    return {
      text: t('cardOpenToday', { range: rangeLabel }),
      state: 'open',
      range: rangeLabel,
      fallback: false,
    };
  }

  return {
    text: t('cardClosedNow', { time: start.label }),
    state: 'closed',
    range: rangeLabel,
    fallback: false,
  };
}

export default function MuseumCard({
  museum,
  priority = false,
  onCategoryClick,
  highlightOpenNow = false,
}) {
  if (!museum) return null;

  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const { t, lang } = useLanguage();
  const isFavorite = favorites.some((f) => f.id === museum.id && f.type === 'museum');
  const hoverColor = useMemo(
    () => getHoverColor(museum.slug, museum.id),
    [museum.slug, museum.id]
  );
  const blurDataUrl = useMemo(() => createBlurDataUrl(hoverColor), [hoverColor]);
  const normalizedImage = useMemo(() => normalizeImageSource(museum.image), [museum.image]);
  const favoriteImageUrl = useMemo(() => resolveImageUrl(museum.image), [museum.image]);
  const placeholderDataUrl = useMemo(() => {
    if (normalizedImage && typeof normalizedImage === 'object' && 'blurDataURL' in normalizedImage) {
      return normalizedImage.blurDataURL || blurDataUrl;
    }
    return blurDataUrl;
  }, [blurDataUrl, normalizedImage]);

  const isExhibitionCard = Array.isArray(museum.categories)
    ? museum.categories.includes('exhibition')
    : false;
  const summary = isExhibitionCard
    ? museum.summary
    : museumSummaries[museum.slug]?.[lang] || museum.summary;
  const meta = museum.meta;
  const metaTag = museum.metaTag;
  const hours = museumOpeningHours[museum.slug]?.[lang];
  const [openingStatus, setOpeningStatus] = useState(() => {
    if (!hours) return null;
    return {
      text: hours,
      state: 'unknown',
      fallback: true,
    };
  });

  useEffect(() => {
    if (!hours) {
      setOpeningStatus(null);
      return undefined;
    }

    const fallbackStatus = {
      text: hours,
      state: 'unknown',
      fallback: true,
    };
    setOpeningStatus(fallbackStatus);

    let mounted = true;
    const nextStatus = resolveOpeningStatus(hours, t);
    if (mounted) {
      setOpeningStatus(nextStatus);
    }

    return () => {
      mounted = false;
    };
  }, [hours, t]);
  const resolvedCategories = useMemo(() => {
    if (!Array.isArray(museum.categories)) return [];
    return museum.categories
      .map((category) => {
        const translationKey = CATEGORY_TRANSLATION_KEYS[category];
        const label = translationKey ? t(translationKey) : category;
        if (!label) return null;
        return { key: category, label };
      })
      .filter(Boolean);
  }, [museum.categories, t]);
  const hasTags = museum.free || resolvedCategories.length > 0;
  const locationText = [museum.city, museum.province].filter(Boolean).join(', ');
  const hasAffiliateTicket = Boolean(museum.ticketAffiliateUrl);
  const showAffiliateNote = hasAffiliateTicket && shouldShowAffiliateNote(museum.slug);
  const showOpenNowBadge =
    highlightOpenNow && openingStatus && openingStatus.state === 'open' && !openingStatus.fallback;
  const headingAutoId = useId();
  const ticketNoteId = useId();
  const headingId = museum.slug ? `museum-card-${museum.slug}-heading` : `${headingAutoId}-heading`;
  const summaryId = summary ? `${headingId}-summary` : undefined;
  const metaTagId = metaTag ? `${headingId}-meta-tag` : undefined;
  const metaId = meta ? `${headingId}-meta` : undefined;
  const describedById = [summaryId, metaTagId, metaId].filter(Boolean).join(' ') || undefined;
  const detailHref = useMemo(
    () => ({ pathname: '/museum/[slug]', query: { slug: museum.slug } }),
    [museum.slug]
  );
  const detailUrl = useMemo(() => (museum.slug ? `/museum/${museum.slug}` : '/'), [museum.slug]);
  const ticketHoverMessage = showAffiliateNote ? t('ticketsAffiliateDisclosure') : undefined;
  const ticketDisclosureLine = [t('ticketsAffiliateDisclosure'), t('ticketsAffiliatePricesMayVary')]
    .filter(Boolean)
    .join(' ');
  const ticketContext = showAffiliateNote
    ? [
        <span key="intro" className="ticket-button__note-line">
          {t('ticketsAffiliateIntro')}
        </span>,
        <span key="details" className="ticket-button__note-line ticket-button__note-disclosure">
          {ticketDisclosureLine}
        </span>,
      ]
    : null;
  const ticketRel = showAffiliateNote ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
  const ticketAriaLabel = showAffiliateNote
    ? `${t('buyTickets')} — ${t('ticketsAffiliateDisclosure')}`
    : t('buyTickets');

  const imageCredit = museum.imageCredit;
  const isPublicDomainImage = Boolean(imageCredit?.isPublicDomain);
  const formattedCredit = useMemo(
    () => (isPublicDomainImage ? null : formatImageCredit(imageCredit, t)),
    [imageCredit, isPublicDomainImage, t]
  );
  const creditSegments = formattedCredit?.segments || [];
  const hasCreditSegments = creditSegments.length > 0;
  const creditFullText = creditSegments.map((segment) => segment.label).join(' • ');

  const [isFavoriteBouncing, setIsFavoriteBouncing] = useState(false);
  const bounceTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (bounceTimeoutRef.current) {
        clearTimeout(bounceTimeoutRef.current);
      }
    };
  }, []);

  const triggerFavoriteBounce = () => {
    if (bounceTimeoutRef.current) {
      clearTimeout(bounceTimeoutRef.current);
    }
    setIsFavoriteBouncing(true);
    bounceTimeoutRef.current = setTimeout(() => {
      setIsFavoriteBouncing(false);
      bounceTimeoutRef.current = null;
    }, 420);
  };

  const handleFavorite = () => {
    toggleFavorite({ ...museum, image: favoriteImageUrl, type: 'museum' });
    triggerFavoriteBounce();
  };

  const renderShareButton = (className = '') => (
    <button
      type="button"
      className={`icon-button${className ? ` ${className}` : ''}`}
      aria-label={t('share')}
      onClick={(event) => {
        event.stopPropagation();
        shareMuseum();
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v14" />
      </svg>
    </button>
  );

  const renderFavoriteButton = (className = '') => (
    <button
      type="button"
      className={`icon-button${isFavorite ? ' favorited' : ''}${
        isFavoriteBouncing ? ' icon-button--bounce' : ''
      }${className ? ` ${className}` : ''}`}
      aria-label={t('save')}
      aria-pressed={isFavorite}
      onClick={(event) => {
        event.stopPropagation();
        handleFavorite();
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
      </svg>
    </button>
  );

  const renderTicketButton = (className = '') => {
    const baseClasses = ['ticket-button'];
    const classNames = className ? `${baseClasses.join(' ')} ${className}` : baseClasses.join(' ');

    if (museum.ticketUrl) {
      const labelClassName = showAffiliateNote
        ? 'ticket-button__label ticket-button__label--stacked'
        : 'ticket-button__label';
      const partnerBadge = showAffiliateNote ? (
        <span className="ticket-button__badge">
          {t('ticketsPartnerBadge')}
          <span className="sr-only"> — {t('ticketsAffiliateIntro')}</span>
        </span>
      ) : null;

      return (
        <Fragment>
          <a
            href={museum.ticketUrl}
            target="_blank"
            rel={ticketRel}
            className={classNames}
            title={ticketHoverMessage}
            aria-label={ticketAriaLabel}
            aria-describedby={showAffiliateNote ? ticketNoteId : undefined}
            data-affiliate={showAffiliateNote ? 'true' : undefined}
            onClick={(event) => event.stopPropagation()}
          >
            <span className={labelClassName}>
              <span className="ticket-button__label-text">{t('buyTickets')}</span>
              {partnerBadge}
            </span>
          </a>
        </Fragment>
      );
    }

    return (
      <button
        type="button"
        className={classNames}
        disabled
        aria-disabled="true"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="ticket-button__label">
          <span className="ticket-button__label-text">{t('buyTickets')}</span>
        </span>
      </button>
    );
  };

  const shareMuseum = async () => {
    if (typeof window === 'undefined') return;

    const url = `${window.location.origin}/museum/${museum.slug}`;
    const shareData = {
      title: museum.title,
      text: `${t('view')} ${museum.title}`,
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
        alert(t('linkCopied'));
        return;
      } catch {
        // ignore
      }
    }

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.prompt(t('copyThisLink'), url);
    }
  };

  const navigateToMuseum = useCallback(
    (openInNewTab = false) => {
      if (!museum.slug) return;
      if (openInNewTab) {
        if (typeof window !== 'undefined') {
          window.open(detailUrl, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      router.push(detailHref);
    },
    [detailHref, detailUrl, museum.slug, router]
  );

  const isInteractiveEvent = useCallback((event) => {
    if (!event) return false;
    let node = event.target;
    while (node && node !== event.currentTarget) {
      if (node && node.nodeType === 1 && typeof node.getAttribute === 'function') {
        if (node.getAttribute('data-card-interactive') === 'true') {
          return true;
        }
      }
      node = node?.parentNode || null;
    }
    return false;
  }, []);

  const handleCardClick = useCallback(
    (event) => {
      if (event.defaultPrevented) return;
      if (isInteractiveEvent(event)) return;
      if (event.button && event.button !== 0) return;
      const openInNewTab = event.metaKey || event.ctrlKey;
      if (openInNewTab) {
        event.preventDefault();
      }
      navigateToMuseum(openInNewTab);
    },
    [isInteractiveEvent, navigateToMuseum]
  );

  const handleCardAuxClick = useCallback(
    (event) => {
      if (isInteractiveEvent(event)) return;
      if (event.button === 1) {
        event.preventDefault();
        navigateToMuseum(true);
      }
    },
    [isInteractiveEvent, navigateToMuseum]
  );

  const handleCardKeyDown = useCallback(
    (event) => {
      if (event.defaultPrevented) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      if (isInteractiveEvent(event)) return;
      event.preventDefault();
      navigateToMuseum(false);
    },
    [isInteractiveEvent, navigateToMuseum]
  );

  return (
    <article
      className="museum-card"
      style={{ '--hover-bg': hoverColor }}
      role="link"
      tabIndex={0}
      aria-labelledby={headingId}
      aria-describedby={describedById}
      onClick={handleCardClick}
      onAuxClick={handleCardAuxClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="museum-card-image">
        {normalizedImage && (
          <Image
            src={normalizedImage}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="museum-card-media"
            style={{ objectFit: 'cover' }}
            {...(placeholderDataUrl ? { placeholder: 'blur', blurDataURL: placeholderDataUrl } : {})}
            priority={priority}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            quality={70}
          />
        )}
        <div className="museum-card-overlay" aria-hidden="true">
          <span className="museum-card-overlay-label">{t('view')}</span>
          <span className="museum-card-overlay-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
        <div className="museum-card-ticket" data-card-interactive="true">
          {renderTicketButton('ticket-button--card')}
        </div>
        <div className="museum-card-actions" data-card-interactive="true">
          {renderShareButton()}
          {renderFavoriteButton()}
        </div>
      </div>
      {!isPublicDomainImage && museum.image && hasCreditSegments && (
        <p className="image-credit" title={creditFullText || undefined}>
          {creditSegments.map((segment, index) => (
            <Fragment key={`${museum.slug}-credit-${segment.key}-${index}`}>
              {index > 0 && (
                <span aria-hidden="true" className="image-credit-divider">
                  •
                </span>
              )}
              {segment.url ? (
                <a
                  className="image-credit-link"
                  href={segment.url}
                  target="_blank"
                  rel="noreferrer"
                  data-card-interactive="true"
                >
                  {segment.label}
                </a>
              ) : (
                <span className="image-credit-part">{segment.label}</span>
              )}
            </Fragment>
          ))}
        </p>
      )}
      <div className="museum-card-info">
        <div className="museum-card-header">
          {locationText && (
            <p className="museum-card-location">
              <span className="museum-card-location-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
                  <path d="M12 21s-7.5-7.048-7.5-11.25a7.5 7.5 0 1 1 15 0C19.5 13.952 12 21 12 21Z" />
                </svg>
              </span>
              <span>{locationText}</span>
            </p>
          )}
          <h3 className="museum-card-title" id={headingId}>
            {museum.title}
          </h3>
          {summary && (
            <p className="museum-card-summary" id={summaryId}>
              {summary}
            </p>
          )}
          {metaTag && (
            <div className="museum-card-meta-tag" id={metaTagId}>
              {metaTag}
            </div>
          )}
          {meta && (
            <p className="museum-card-meta" id={metaId}>
              {meta}
            </p>
          )}
        </div>
        {showOpenNowBadge && (
          <div className="museum-card-badges">
            <Badge variant="solid" size="sm" tone="brand">
              {t('openNowBadge')}
            </Badge>
          </div>
        )}
        {openingStatus && (
          <p
            className={`museum-card-hours${
              openingStatus.state === 'closed'
                ? ' museum-card-hours--closed'
                : openingStatus.fallback
                ? ' museum-card-hours--fallback'
                : ''
            }`}
          >
            <span className="museum-card-hours-indicator" aria-hidden="true" />
            <span>{openingStatus.text}</span>
          </p>
        )}
        {hasTags && (
          <div className="museum-card-tags" data-card-interactive="true">
            {resolvedCategories.map(({ key, label }, index) => (
              <button
                key={`${museum.slug}-category-${index}`}
                type="button"
                className="tag tag-button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCategoryClick?.(key, label, museum);
                }}
              >
                {label}
              </button>
            ))}
            {museum.free && <span className="tag">{t('free')}</span>}
          </div>
        )}
        {ticketContext ? (
          <div data-card-interactive="true">
            <TicketButtonNote
              affiliate={showAffiliateNote}
              showIcon={false}
              id={ticketNoteId}
              className="museum-card__affiliate-note"
            >
              {ticketContext}
            </TicketButtonNote>
          </div>
        ) : null}
      </div>
    </article>
  );
}
