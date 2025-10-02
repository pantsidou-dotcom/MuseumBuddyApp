import Link from 'next/link';
import Image from 'next/image';
import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLanguage } from './LanguageContext';
import { useFavorites } from './FavoritesContext';
import TicketButtonNote from './TicketButtonNote';
import { shouldShowAffiliateNote } from '../lib/nonAffiliateMuseums';
import formatImageCredit from '../lib/formatImageCredit';
import { normalizeImageSource, resolveImageUrl } from '../lib/resolveImageSource';

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

const HOVER_COLORS = ['#A7D8F0', '#77DDDD', '#F7C59F', '#D8BFD8', '#EAE0C8'];

function getHoverColor(slug, id) {
  const key = slug || (typeof id !== 'undefined' ? String(id) : '');
  if (!key) {
    return HOVER_COLORS[0];
  }
  const index = hashKey(key) % HOVER_COLORS.length;
  return HOVER_COLORS[index];
}

function createBlurDataUrl(color) {
  if (typeof color !== 'string' || !color) {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20"%3E%3Crect width="32" height="20" fill="%23e2e8f0" /%3E%3C/svg%3E';
  }

  const normalized = color.startsWith('#') ? color : `#${color}`;
  const sanitized = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)
    ? normalized
    : '#e2e8f0';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 20"><rect width="32" height="20" fill="${sanitized}" /></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function formatRange(startDate, endDate, locale) {
  if (!startDate) return '';
  const start = new Date(`${startDate}T00:00:00`);
  const end = endDate ? new Date(`${endDate}T00:00:00`) : null;
  const options = { day: '2-digit', month: 'short' };
  const startLabel = start.toLocaleDateString(locale, options).toUpperCase();
  if (!end) {
    return startLabel;
  }
  const endLabel = end.toLocaleDateString(locale, options).toUpperCase();
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
  if (sameMonth) {
    const month = startLabel.split(' ')[1];
    return `${String(start.getDate()).padStart(2, '0')} - ${String(end.getDate()).padStart(2, '0')} ${month}`;
  }
  return `${startLabel} - ${endLabel}`;
}

function isAbsoluteUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

export default function ExhibitionGridCard({ exhibition, priority = false }) {
  const { t, lang } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();

  if (!exhibition) return null;

  const museum = exhibition.museum || {};
  const slug = museum.slug;
  const hoverColor = useMemo(() => getHoverColor(slug, exhibition.id), [slug, exhibition.id]);
  const blurDataUrl = useMemo(() => createBlurDataUrl(hoverColor), [hoverColor]);
  const normalizedImage = useMemo(() => normalizeImageSource(exhibition.image), [exhibition.image]);
  const placeholderDataUrl = useMemo(() => {
    if (normalizedImage && typeof normalizedImage === 'object' && 'blurDataURL' in normalizedImage) {
      return normalizedImage.blurDataURL || blurDataUrl;
    }
    return blurDataUrl;
  }, [blurDataUrl, normalizedImage]);

  const favoriteImageUrl = useMemo(() => resolveImageUrl(exhibition.image), [exhibition.image]);
  const locationText = [museum.city, museum.province].filter(Boolean).join(', ');
  const locale = lang === 'en' ? 'en-US' : 'nl-NL';
  const rangeLabel = formatRange(exhibition.startDate, exhibition.endDate, locale);
  const description = typeof exhibition.description === 'string' ? exhibition.description.trim() : '';
  const summaryText = useMemo(() => {
    const intro = museum.name ? `${museum.name}` : '';
    const cleaned = description.replace(/\s+/g, ' ').trim();
    if (!intro && !cleaned) return '';
    const base = intro && cleaned ? `${intro} — ${cleaned}` : intro || cleaned;
    if (base.length <= 180) return base;
    return `${base.slice(0, 177)}…`;
  }, [description, museum.name]);

  const isFavorite = favorites.some((item) => item.id === exhibition.id && item.type === 'exposition');
  const ticketAffiliateUrl = exhibition.ticketAffiliateUrl || null;
  const fallbackTicketUrl = exhibition.ticketUrl || null;
  const sourceUrl = exhibition.sourceUrl || null;
  const moreInfoUrl = exhibition.moreInfoUrl || sourceUrl || (slug ? `/museum/${slug}` : null);
  const buyUrl = ticketAffiliateUrl || fallbackTicketUrl || sourceUrl || (slug ? `/museum/${slug}` : null);
  const showAffiliateNote = Boolean(ticketAffiliateUrl) && (!slug || shouldShowAffiliateNote(slug));
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

  const imageCredit = exhibition.imageCredit;
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
    toggleFavorite({
      id: exhibition.id,
      titel: exhibition.title,
      start_datum: exhibition.startDate,
      eind_datum: exhibition.endDate,
      bron_url: sourceUrl,
      ticketAffiliateUrl: ticketAffiliateUrl,
      ticketUrl: buyUrl,
      museumSlug: slug,
      image: favoriteImageUrl,
      type: 'exposition',
    });
    triggerFavoriteBounce();
  };

  const shareExhibition = async () => {
    const fallbackPath = slug ? `/museum/${slug}` : '/tentoonstellingen';
    let shareUrl = sourceUrl || fallbackPath;

    if (!isAbsoluteUrl(shareUrl) && typeof window !== 'undefined') {
      const origin = window.location?.origin || '';
      shareUrl = `${origin}${shareUrl.startsWith('/') ? shareUrl : `/${shareUrl}`}`;
    }

    const shareData = {
      title: exhibition.title,
      text: `${exhibition.title}${museum.name ? ` — ${museum.name}` : ''}`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // ignore share cancellation
      }
    }

    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareData.url);
        alert(t('linkCopied'));
        return;
      } catch {
        // ignore clipboard failure
      }
    }

    try {
      window.open(shareData.url, '_blank', 'noopener,noreferrer');
    } catch {
      window.prompt(t('copyThisLink'), shareData.url);
    }
  };

  const renderShareButton = (className = '') => (
    <button
      type="button"
      className={`icon-button${className ? ` ${className}` : ''}`}
      aria-label={t('share')}
      onClick={shareExhibition}
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

  const tagDefinitions = [
    { key: 'childFriendly', label: t('tagChildFriendly'), active: Boolean(exhibition.tags?.childFriendly) },
    { key: 'free', label: t('tagFree'), active: Boolean(exhibition.tags?.free) },
    { key: 'temporary', label: t('tagTemporary'), active: Boolean(exhibition.tags?.temporary) },
  ];
  const activeTags = tagDefinitions.filter((tag) => tag.active);

  const moreInfoIsExternal = isAbsoluteUrl(moreInfoUrl);

  return (
    <article className="museum-card" style={{ '--hover-bg': hoverColor }}>
      <div className="museum-card-image">
        <Link
          href={{ pathname: '/museum/[slug]', query: { slug } }}
          className="museum-card-media-link"
          aria-label={`${t('view')} ${museum.name || exhibition.title}`}
        >
          {normalizedImage && (
            <Image
              src={normalizedImage}
              alt={museum.name || exhibition.title}
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </span>
          </div>
        </Link>
        <div className="museum-card-ticket">
          {buyUrl ? (
            <a
              className="ticket-button ticket-button--card"
              href={buyUrl}
              target={isAbsoluteUrl(buyUrl) ? '_blank' : undefined}
              rel={isAbsoluteUrl(buyUrl) ? ticketRel : undefined}
              aria-label={ticketAriaLabel}
              title={ticketHoverMessage}
              {...(ticketContext ? { 'aria-describedby': ticketNoteId } : {})}
            >
              <span className="ticket-button__label">{t('buyTickets')}</span>
            </a>
          ) : null}
          {moreInfoUrl ? (
            moreInfoIsExternal ? (
              <a
                href={moreInfoUrl}
                className="ticket-button--secondary"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('moreInformation')}
              </a>
            ) : (
              <Link href={moreInfoUrl} className="ticket-button--secondary">
                {t('moreInformation')}
              </Link>
            )
          ) : null}
        </div>
        <div className="museum-card-actions">
          {renderShareButton()}
          {renderFavoriteButton()}
        </div>
      </div>
      {!isPublicDomainImage && exhibition.image && hasCreditSegments && (
        <p className="image-credit" title={creditFullText || undefined}>
          {creditSegments.map((segment, index) => (
            <Fragment key={`${slug || exhibition.id}-credit-${segment.key}-${index}`}>
              {index > 0 && (
                <span aria-hidden="true" className="image-credit-divider">
                  •
                </span>
              )}
              {segment.url ? (
                <a className="image-credit-link" href={segment.url} target="_blank" rel="noreferrer">
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
          {exhibition.title}
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
          {rangeLabel && (
            <p className="museum-card-meta-item">
              <span className="museum-card-meta-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8.25" />
                  <path d="M12 7.5v4.5l2.5 1.5" />
                </svg>
              </span>
              <span className="museum-card-meta-text">{rangeLabel}</span>
            </p>
          )}
        </div>
        {summaryText && <p className="museum-card-summary">{summaryText}</p>}
        {activeTags.length > 0 && (
          <div className="museum-card-tags">
            {activeTags.map((tag) => (
              <span key={`${exhibition.id}-${tag.key}`} className="tag">
                {tag.label}
              </span>
            ))}
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
