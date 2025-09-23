import Image from 'next/image';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLanguage } from './LanguageContext';
import { useFavorites } from './FavoritesContext';
import { shouldShowAffiliateNote } from '../lib/nonAffiliateMuseums';
import TicketButtonAffiliateInfo from './TicketButtonAffiliateInfo';
import TicketButtonNote from './TicketButtonNote';

const FALLBACK_IMAGE = '/images/exposition-placeholder.svg';

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

function resolveMediaUrl(exposition) {
  if (!exposition || typeof exposition !== 'object') return null;
  const primaryKeys = [
    'image',
    'image_url',
    'imageUrl',
    'afbeelding',
    'afbeelding_url',
    'afbeeldingUrl',
    'mediaUrl',
    'coverImage',
    'cover_image',
    'poster',
    'posterUrl',
    'hero_image',
    'heroImage',
  ];
  for (const key of primaryKeys) {
    const value = exposition[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  const collectionKeys = ['images', 'photos', 'media', 'gallery'];
  for (const key of collectionKeys) {
    const value = exposition[key];
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.trim()) {
          return item.trim();
        }
        if (item && typeof item === 'object') {
          if (typeof item.url === 'string' && item.url.trim()) {
            return item.url.trim();
          }
          if (typeof item.src === 'string' && item.src.trim()) {
            return item.src.trim();
          }
        }
      }
    } else if (value && typeof value === 'object') {
      if (typeof value.url === 'string' && value.url.trim()) {
        return value.url.trim();
      }
      if (typeof value.src === 'string' && value.src.trim()) {
        return value.src.trim();
      }
    }
  }
  return null;
}

function resolveMediaAlt(exposition, translate) {
  if (!exposition || typeof exposition !== 'object') {
    return typeof translate === 'function' ? translate('exhibitionsTitle') : '';
  }
  const altKeys = [
    'image_alt',
    'imageAlt',
    'image_alt_text',
    'imageAltText',
    'afbeelding_alt',
    'afbeeldingAlt',
    'afbeelding_omschrijving',
    'afbeeldingOmschrijving',
    'media_alt',
    'mediaAlt',
    'poster_alt',
    'posterAlt',
    'hero_image_alt',
    'heroImageAlt',
    'cover_image_alt',
    'coverImageAlt',
    'alt',
  ];
  for (const key of altKeys) {
    const value = exposition[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  if (typeof exposition.titel === 'string' && exposition.titel.trim()) {
    return exposition.titel.trim();
  }
  return typeof translate === 'function' ? translate('exhibitionsTitle') : '';
}

function pickBoolean(...values) {
  for (const value of values) {
    if (typeof value === 'boolean') return value;
  }
  return undefined;
}

export default function ExpositionCard({ exposition, ticketUrl, affiliateUrl, museumSlug, tags = {} }) {
  if (!exposition) return null;

  const start = exposition.start_datum ? new Date(exposition.start_datum + 'T00:00:00') : null;
  const end = exposition.eind_datum ? new Date(exposition.eind_datum + 'T00:00:00') : null;
  const description = typeof exposition.description === 'string' ? exposition.description.trim() : '';
  const { lang, t } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const locale = lang === 'en' ? 'en-US' : 'nl-NL';
  const rangeLabel = formatRange(start, end, locale);
  const isFavorite = favorites.some((f) => f.id === exposition.id && f.type === 'exposition');
  const slug = museumSlug || exposition.museumSlug;
  const primaryAffiliateUrl = exposition.ticketAffiliateUrl || affiliateUrl || null;
  const fallbackTicketUrl = exposition.ticketUrl || ticketUrl || null;
  const sourceUrl = exposition.bron_url || null;
  const buyUrl = primaryAffiliateUrl || fallbackTicketUrl || sourceUrl;
  const showAffiliateNote = Boolean(primaryAffiliateUrl) && (!slug || shouldShowAffiliateNote(slug));
  const ticketContext = t(showAffiliateNote ? 'ticketsViaPartner' : 'ticketsViaOfficialSite');
  const ticketHoverMessage = showAffiliateNote ? t('ticketsAffiliateHover') : undefined;
  const ticketNoteId = useId();
  const ctaDescribedBy = ticketContext ? ticketNoteId : undefined;

  const [isFavoriteBouncing, setIsFavoriteBouncing] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
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

  const mediaUrl = useMemo(() => resolveMediaUrl(exposition), [exposition]);
  const hasMedia = Boolean(mediaUrl) && !hasImageError;
  const resolvedImage = hasMedia ? mediaUrl : FALLBACK_IMAGE;
  const favoriteImage = hasMedia ? mediaUrl : FALLBACK_IMAGE;
  const resolvedAltText = useMemo(() => resolveMediaAlt(exposition, t), [exposition, t]);

  useEffect(() => {
    setHasImageError(false);
    setIsImageLoaded(false);
  }, [mediaUrl]);

  const handleFavorite = () => {
    toggleFavorite({
      id: exposition.id,
      titel: exposition.titel,
      start_datum: exposition.start_datum,
      eind_datum: exposition.eind_datum,
      bron_url: sourceUrl,
      ticketAffiliateUrl: primaryAffiliateUrl,
      ticketUrl: buyUrl,
      museumSlug: slug,
      image: favoriteImage,
      type: 'exposition',
    });
    triggerFavoriteBounce();
  };

  const summaryText = useMemo(() => {
    if (!description) return '';
    const cleaned = description.replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    if (cleaned.length <= 160) return cleaned;
    return `${cleaned.slice(0, 157)}…`;
  }, [description]);

  let temporaryTag = pickBoolean(tags.temporary, exposition?.tijdelijk, exposition?.temporary, exposition?.tijdelijkeTentoonstelling);
  if (temporaryTag === undefined && start && end) {
    temporaryTag = true;
  }
  const tagDefinitions = [
    { key: 'childFriendly', label: t('tagChildFriendly'), active: pickBoolean(tags.childFriendly, exposition?.kindvriendelijk, exposition?.childFriendly, exposition?.familievriendelijk, exposition?.familyFriendly) === true },
    { key: 'free', label: t('tagFree'), active: pickBoolean(tags.free, exposition?.gratis, exposition?.free, exposition?.kosteloos, exposition?.freeEntry) === true },
    { key: 'temporary', label: t('tagTemporary'), active: temporaryTag === true },
  ];
  const activeTags = tagDefinitions.filter((tag) => tag.active);

  const mediaClassName = [
    'exposition-card__media',
    !isImageLoaded ? ' is-loading' : '',
    hasMedia ? '' : ' is-placeholder',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={`exposition-card${isFavoriteBouncing ? ' is-bouncing' : ''}`}>
      <div className={mediaClassName} aria-busy={!isImageLoaded}>
        {!isImageLoaded && (
          <div className="exposition-card__skeleton" aria-hidden="true">
            <div className="exposition-card__skeleton-shimmer" />
          </div>
        )}
        <Image
          src={resolvedImage}
          alt={resolvedAltText}
          width={630}
          height={300}
          className="exposition-card__image"
          loading="lazy"
          sizes="(max-width: 600px) 100vw, (max-width: 1024px) 70vw, 300px"
          onLoadingComplete={() => setIsImageLoaded(true)}
          onError={() => {
            setHasImageError(true);
            setIsImageLoaded(true);
          }}
        />
      </div>
      <div className="exposition-card__body">
        <div className="exposition-card__topline">
          {rangeLabel && (
            <div className="exposition-card__date">
              <span className="exposition-card__date-label">{t('duration')}</span>
              <span className="exposition-card__date-value">{rangeLabel}</span>
            </div>
          )}
          <button
            className={`icon-button large${isFavorite ? ' favorited' : ''}${
              isFavoriteBouncing ? ' icon-button--bounce' : ''
            }`}
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
        <h3 className="exposition-card__title">
          {exposition.bron_url ? (
            <a href={exposition.bron_url} target="_blank" rel="noreferrer">
              {exposition.titel}
            </a>
          ) : (
            exposition.titel
          )}
        </h3>
        {summaryText && <p className="exposition-card__summary">{summaryText}</p>}
        {activeTags.length > 0 && (
          <ul className="exposition-card__tags">
            {activeTags.map((tag) => (
              <li key={tag.key}>
                <span className="exposition-card__tag">{tag.label}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="exposition-card__footer">
        {buyUrl ? (
          <a
            href={buyUrl}
            target="_blank"
            rel="noreferrer"
            className="ticket-button exposition-card__cta"
            aria-describedby={ctaDescribedBy}
            title={ticketHoverMessage}
          >
            <span className="ticket-button__label">
              {showAffiliateNote ? (
                <TicketButtonAffiliateInfo infoMessage={ticketHoverMessage} />
              ) : null}
              <span className="ticket-button__label-text">{t('buyTickets')}</span>
            </span>
            {ticketContext ? (
              <TicketButtonNote
                affiliate={showAffiliateNote}
                id={ticketNoteId}
              >
                {ticketContext}
              </TicketButtonNote>
            ) : null}
          </a>
        ) : (
          <button type="button" className="ticket-button exposition-card__cta" disabled aria-disabled="true">
            <span className="ticket-button__label">
              <span className="ticket-button__label-text">{t('buyTickets')}</span>
            </span>
          </button>
        )}
      </div>
    </article>
  );
}
