import Link from 'next/link';
import Image from 'next/image';
import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useFavorites } from './FavoritesContext';
import { useLanguage } from './LanguageContext';
import museumSummaries from '../lib/museumSummaries';
import museumOpeningHours from '../lib/museumOpeningHours';
import { shouldShowAffiliateNote } from '../lib/nonAffiliateMuseums';
import formatImageCredit from '../lib/formatImageCredit';
import TicketButtonNote from './TicketButtonNote';

// Keep in sync with --card-accent-soft-solid in styles/globals.css
const CARD_ACCENT_SOFT_HEX = '#dbeafe';

function createBlurDataUrl(color = CARD_ACCENT_SOFT_HEX) {
  if (typeof color !== 'string' || !color) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20"%3E%3Crect width="32" height="20" fill="%23e2e8f0" /%3E%3C/svg%3E';
  }

  const normalized = color.startsWith('#') ? color : `#${color}`;
  const sanitized = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)
    ? normalized
    : CARD_ACCENT_SOFT_HEX;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20"><rect width="32" height="20" fill="${sanitized}" /></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const DEFAULT_BLUR_DATA_URL = createBlurDataUrl();

export default function MuseumCard({ museum, priority = false }) {
  if (!museum) return null;

  const { favorites, toggleFavorite } = useFavorites();
  const { t, lang } = useLanguage();
  const isFavorite = favorites.some((f) => f.id === museum.id && f.type === 'museum');
  const blurDataUrl = DEFAULT_BLUR_DATA_URL;

  const summary = museumSummaries[museum.slug]?.[lang] || museum.summary;
  const hours = museumOpeningHours[museum.slug]?.[lang];
  const locationText = [museum.city, museum.province].filter(Boolean).join(', ');
  const showAffiliateNote = Boolean(museum.ticketUrl) && shouldShowAffiliateNote(museum.slug);
  const ticketNoteId = useId();
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
    toggleFavorite({ ...museum, type: 'museum' });
    triggerFavoriteBounce();
  };

  const renderShareButton = (className = '') => (
    <button
      type="button"
      className={`icon-button${className ? ` ${className}` : ''}`}
      aria-label={t('share')}
      onClick={shareMuseum}
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
      onClick={handleFavorite}
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
      <button type="button" className={classNames} disabled aria-disabled="true">
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

  return (
    <article className="museum-card">
      <div className="museum-card-image">
        <Link
          href={{ pathname: '/museum/[slug]', query: { slug: museum.slug } }}
          className="museum-card-media-link"
          aria-label={`${t('view')} ${museum.title}`}
        >
          {museum.image && (
            <Image
              src={museum.image.startsWith('/') ? museum.image : `/${museum.image}`}
              alt={museum.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="museum-card-media"
              style={{ objectFit: 'cover' }}
              placeholder="blur"
              blurDataURL={blurDataUrl}
              priority={priority}
              loading={priority ? 'eager' : 'lazy'}
              quality={70}
            />
          )}
          <div className="museum-card-overlay" aria-hidden="true">
            <span className="museum-card-overlay-label">{t('view')}</span>
            <span className="museum-card-overlay-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </Link>
        <div className="museum-card-ticket">{renderTicketButton('ticket-button--card')}</div>
        <div className="museum-card-actions">
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
        <h3 className="museum-card-title">
          <Link
            href={{ pathname: '/museum/[slug]', query: { slug: museum.slug } }}
            className="museum-card-title-link"
          >
            {museum.title}
          </Link>
        </h3>
        <div className="museum-card-meta">
          {locationText && (
            <p className="museum-card-meta-item">
              <span className="museum-card-meta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" />
                  <path d="M12 21s-7.5-7.048-7.5-11.25a7.5 7.5 0 1 1 15 0C19.5 13.952 12 21 12 21Z" />
                </svg>
              </span>
              <span className="museum-card-meta-text">{locationText}</span>
            </p>
          )}
          {hours && (
            <p className="museum-card-meta-item">
              <span className="museum-card-meta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8.25" />
                  <path d="M12 7.5v4.5l2.5 1.5" />
                </svg>
              </span>
              <span className="museum-card-meta-text">{hours}</span>
            </p>
          )}
        </div>
        {summary && <p className="museum-card-summary">{summary}</p>}
        {museum.free && (
          <div className="museum-card-tags">
            <span className="tag">{t('free')}</span>
          </div>
        )}
        {ticketContext ? (
          <TicketButtonNote
            affiliate={showAffiliateNote}
            showIcon={false}
            id={ticketNoteId}
            className="museum-card__affiliate-note"
          >
            {ticketContext}
          </TicketButtonNote>
        ) : null}
      </div>
    </article>
  );
}
