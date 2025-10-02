import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from './LanguageContext';
import { useFavorites } from './FavoritesContext';
import museumImages from '../lib/museumImages';
import museumImageCredits from '../lib/museumImageCredits';
import formatImageCredit from '../lib/formatImageCredit';
import { normalizeImageSource } from '../lib/resolveImageSource';
import { shouldShowAffiliateNote } from '../lib/nonAffiliateMuseums';
import museumTicketUrls from '../lib/museumTicketUrls';
import resolveMuseumSlug from '../lib/resolveMuseumSlug';
import TicketButtonNote from './TicketButtonNote';

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
  const rawMuseumName =
    exposition.museumName || exposition.museum_name || exposition.museum || exposition.host || null;
  const rawMuseumSlug = museumSlug || exposition.museumSlug || exposition.museum_slug || exposition.slug || null;
  const slug = useMemo(() => resolveMuseumSlug(rawMuseumSlug, rawMuseumName), [rawMuseumSlug, rawMuseumName]);
  const primaryAffiliateUrl =
    exposition.ticketAffiliateUrl ||
    affiliateUrl ||
    (slug ? museumTicketUrls[slug] || null : null);
  const fallbackTicketUrl = exposition.ticketUrl || ticketUrl || null;
  const sourceUrl = exposition.bron_url || null;
  const buyUrl = primaryAffiliateUrl || fallbackTicketUrl || null;
  const showAffiliateNote = Boolean(primaryAffiliateUrl) && (!slug || shouldShowAffiliateNote(slug));
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
  const ticketNoteId = useId();
  const ctaDescribedBy = ticketContext ? ticketNoteId : undefined;

  const museumImage = slug ? museumImages[slug] : null;
  const normalizedMuseumImage = useMemo(() => normalizeImageSource(museumImage), [museumImage]);
  const hasMuseumImage = Boolean(normalizedMuseumImage);
  const isStaticMuseumImage = Boolean(museumImage && typeof museumImage === 'object' && 'src' in museumImage);
  const imageCredit = museumImageCredits[slug];
  const isPublicDomainImage = Boolean(imageCredit?.isPublicDomain);
  const formattedCredit = useMemo(
    () => (isPublicDomainImage ? null : formatImageCredit(imageCredit, t)),
    [imageCredit, isPublicDomainImage, t]
  );
  const creditSegments = formattedCredit?.segments || [];
  const hasCreditSegments = creditSegments.length > 0;
  const creditFullText = hasCreditSegments
    ? creditSegments.map((segment) => segment.label).join(' • ')
    : null;

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
      id: exposition.id,
      titel: exposition.titel,
      start_datum: exposition.start_datum,
      eind_datum: exposition.eind_datum,
      bron_url: sourceUrl,
      ticketAffiliateUrl: primaryAffiliateUrl,
      ticketUrl: buyUrl,
      museumSlug: slug,
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
  const moreInfoUrl = sourceUrl || (slug ? `/museum/${slug}` : null);
  const isInternalMoreInfo = Boolean(moreInfoUrl && moreInfoUrl.startsWith('/'));
  const moreInfoTarget = moreInfoUrl && !isInternalMoreInfo ? '_blank' : undefined;
  const moreInfoRel = moreInfoUrl && !isInternalMoreInfo ? 'noopener noreferrer' : undefined;

  return (
    <article
      className={`exposition-card${isFavoriteBouncing ? ' is-bouncing' : ''}`}
    >
      <div
        className={`exposition-card__media${hasMuseumImage ? '' : ' exposition-card__media--placeholder'}`}
        aria-hidden="true"
      >
        {hasMuseumImage ? (
          isStaticMuseumImage ? (
            <Image
              src={museumImage}
              alt=""
              fill
              sizes="(min-width: 1280px) 340px, (min-width: 1024px) 300px, (min-width: 768px) 45vw, 100vw"
              className="exposition-card__image"
              placeholder={museumImage.blurDataURL ? 'blur' : undefined}
            />
          ) : (
            <img
              src={normalizedMuseumImage}
              alt=""
              className="exposition-card__image"
              loading="lazy"
            />
          )
        ) : (
          <span className="exposition-card__media-placeholder" />
        )}
        {hasMuseumImage && hasCreditSegments && !isPublicDomainImage ? (
          <p className="image-credit exposition-card__image-credit" title={creditFullText || undefined}>
            {creditSegments.map((segment, index) => (
              <Fragment key={`${slug || exposition.id}-credit-${segment.key}-${index}`}>
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
        ) : null}
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
        <div className="exposition-card__footer-actions">
          {moreInfoUrl ? (
            isInternalMoreInfo ? (
              <Link href={moreInfoUrl} className="exposition-card__info-button">
                {t('exhibitionsMoreInfoCta')}
              </Link>
            ) : (
              <a
                href={moreInfoUrl}
                className="exposition-card__info-button"
                target={moreInfoTarget}
                rel={moreInfoRel}
              >
                {t('exhibitionsMoreInfoCta')}
              </a>
            )
          ) : null}
          {buyUrl ? (
            <a
              href={buyUrl}
              target="_blank"
              rel={ticketRel}
              className="ticket-button exposition-card__cta exposition-card__cta--tickets"
              aria-describedby={ctaDescribedBy}
              title={ticketHoverMessage}
              aria-label={ticketAriaLabel}
              data-affiliate={showAffiliateNote ? 'true' : undefined}
            >
              <span
                className={
                  showAffiliateNote
                    ? 'ticket-button__label ticket-button__label--stacked'
                    : 'ticket-button__label'
                }
              >
                <span className="ticket-button__label-text">{t('buyTickets')}</span>
                {showAffiliateNote ? (
                  <span className="ticket-button__badge">
                    {t('ticketsPartnerBadge')}
                    <span className="sr-only"> — {t('ticketsAffiliateIntro')}</span>
                  </span>
                ) : null}
              </span>
            </a>
          ) : (
            <button
              type="button"
              className="ticket-button exposition-card__cta exposition-card__cta--tickets"
              disabled
              aria-disabled="true"
            >
              <span className="ticket-button__label">
                <span className="ticket-button__label-text">{t('buyTickets')}</span>
              </span>
            </button>
          )}
        </div>
        {ticketContext ? (
          <TicketButtonNote
            affiliate={showAffiliateNote}
            showIcon={false}
            id={ticketNoteId}
            className="exposition-card__affiliate-note"
          >
            {ticketContext}
          </TicketButtonNote>
        ) : null}
      </div>
    </article>
  );
}
