import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from './LanguageContext';
import { useFavorites } from './FavoritesContext';
import museumImages from '../lib/museumImages';
import museumImageCredits from '../lib/museumImageCredits';
import formatImageCredit from '../lib/formatImageCredit';
import { normalizeImageSource, resolveImageUrl } from '../lib/resolveImageSource';
import { shouldShowAffiliateNote } from '../lib/nonAffiliateMuseums';
import museumTicketUrls from '../lib/museumTicketUrls';
import resolveMuseumSlug from '../lib/resolveMuseumSlug';
import TicketButtonNote from './TicketButtonNote';
import museumSummaries from '../lib/museumSummaries';

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

export default function ExpositionCard({
  exposition,
  ticketUrl,
  affiliateUrl,
  museumSlug,
  canonicalMuseumSlug,
  tags = {},
}) {
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
  const rawMuseumSlug =
    museumSlug || exposition.museumSlug || exposition.museum_slug || exposition.slug || null;
  const canonicalSlug = useMemo(
    () =>
      canonicalMuseumSlug ||
      exposition.canonicalMuseumSlug ||
      resolveMuseumSlug(rawMuseumSlug, rawMuseumName),
    [canonicalMuseumSlug, exposition.canonicalMuseumSlug, rawMuseumName, rawMuseumSlug]
  );
  const linkSlug = rawMuseumSlug || canonicalSlug || null;
  const ticketLookupSlug = canonicalSlug || linkSlug;
  const primaryAffiliateUrl =
    exposition.ticketAffiliateUrl ||
    affiliateUrl ||
    (ticketLookupSlug ? museumTicketUrls[ticketLookupSlug] || null : null);
  const fallbackTicketUrl =
    exposition.ticketUrl ||
    ticketUrl ||
    (ticketLookupSlug ? museumTicketUrls[ticketLookupSlug] || null : null);
  const sourceUrl = exposition.bron_url || null;
  const buyUrl = primaryAffiliateUrl || fallbackTicketUrl || null;
  const showAffiliateNote =
    Boolean(primaryAffiliateUrl) && (!ticketLookupSlug || shouldShowAffiliateNote(ticketLookupSlug));
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

  const museumCity = exposition.museumCity || exposition.city || exposition.stad || null;
  const museumProvince =
    exposition.museumProvince || exposition.province || exposition.provincie || null;

  const slugMuseumImage = canonicalSlug ? museumImages[canonicalSlug] || null : null;
  const museumImageSource = slugMuseumImage || exposition.museumImage || null;
  const normalizedMuseumImage = useMemo(
    () => normalizeImageSource(museumImageSource),
    [museumImageSource]
  );
  const hasMuseumImage = Boolean(normalizedMuseumImage);
  const isStaticMuseumImage = Boolean(
    museumImageSource && typeof museumImageSource === 'object' && 'src' in museumImageSource
  );
  const imageCredit =
    (canonicalSlug ? museumImageCredits[canonicalSlug] : null) || exposition.museumImageCredit || null;
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
    const favoriteImageUrl = resolveImageUrl(exposition.museumImage || museumImageSource);
    toggleFavorite({
      id: exposition.id,
      titel: exposition.titel,
      start_datum: exposition.start_datum,
      eind_datum: exposition.eind_datum,
      bron_url: sourceUrl,
      ticketAffiliateUrl: primaryAffiliateUrl,
      ticketUrl: buyUrl,
      museumSlug: linkSlug,
      canonicalMuseumSlug: canonicalSlug,
      museumName: exposition.museumName || rawMuseumName || null,
      museumCity,
      museumProvince,
      museumOpeningHours: exposition.museumOpeningHours || null,
      description: exposition.description || null,
      tags: { ...exposition.tags },
      museumImage: favoriteImageUrl,
      museumImageCredit: imageCredit || null,
      type: 'exposition',
    });
    triggerFavoriteBounce();
  };

  const fallbackSummary = useMemo(() => {
    if (!canonicalSlug) return '';
    const summary = museumSummaries[canonicalSlug];
    if (!summary) return '';
    return summary[lang] || summary[lang === 'en' ? 'nl' : 'en'] || '';
  }, [canonicalSlug, lang]);

  const summaryText = useMemo(() => {
    const source = description || fallbackSummary;
    if (!source) return '';
    const cleaned = String(source).replace(/\s+/g, ' ').trim();
    if (!cleaned) return '';
    if (cleaned.length <= 160) return cleaned;
    return `${cleaned.slice(0, 157)}…`;
  }, [description, fallbackSummary]);

  const locationText = useMemo(() => {
    const city = museumCity ? String(museumCity).trim() : '';
    const provinceCandidate = museumProvince ? String(museumProvince).trim() : '';
    const province = provinceCandidate && provinceCandidate !== city ? provinceCandidate : '';
    return [city, province].filter(Boolean).join(', ');
  }, [museumCity, museumProvince]);

  const openingHoursText = useMemo(() => {
    const hours = exposition.museumOpeningHours;
    if (!hours) return '';
    if (typeof hours === 'string') {
      return hours.trim();
    }
    const localeKey = lang === 'en' ? 'en' : 'nl';
    const fallbackKey = localeKey === 'en' ? 'nl' : 'en';
    const value = hours?.[localeKey] || hours?.[fallbackKey];
    return typeof value === 'string' ? value.trim() : '';
  }, [exposition.museumOpeningHours, lang]);

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
  const moreInfoUrl = sourceUrl || (linkSlug ? `/museum/${linkSlug}` : null);
  const isInternalMoreInfo = Boolean(moreInfoUrl && moreInfoUrl.startsWith('/'));
  const moreInfoTarget = moreInfoUrl && !isInternalMoreInfo ? '_blank' : undefined;
  const moreInfoRel = moreInfoUrl && !isInternalMoreInfo ? 'noopener noreferrer' : undefined;

  const shareUrl = useMemo(() => {
    if (moreInfoUrl) return moreInfoUrl;
    if (linkSlug) return `/museum/${linkSlug}`;
    if (sourceUrl) return sourceUrl;
    return null;
  }, [linkSlug, moreInfoUrl, sourceUrl]);

  const trimmedMuseumName = exposition.museumName ? String(exposition.museumName).trim() : '';
  const trimmedTitle = exposition.titel ? String(exposition.titel).trim() : '';
  const hasDistinctTitle = Boolean(trimmedMuseumName && trimmedTitle && trimmedMuseumName !== trimmedTitle);
  const primaryTitle = trimmedMuseumName || trimmedTitle;
  const secondaryTitle = hasDistinctTitle ? trimmedTitle : '';

  const metaItems = useMemo(
    () =>
      [
        rangeLabel ? { key: 'dates', label: rangeLabel } : null,
        locationText ? { key: 'location', label: locationText } : null,
        openingHoursText ? { key: 'hours', label: openingHoursText } : null,
      ].filter(Boolean),
    [locationText, openingHoursText, rangeLabel]
  );

  const handleShare = async () => {
    if (typeof window === 'undefined' || !shareUrl) return;

    const absoluteUrl = shareUrl.startsWith('http')
      ? shareUrl
      : `${window.location.origin}${shareUrl.startsWith('/') ? shareUrl : `/${shareUrl}`}`;
    const shareTitle = primaryTitle || trimmedTitle || 'MuseumBuddy';
    const shareData = {
      title: shareTitle,
      text: `${t('view')} ${shareTitle}`,
      url: absoluteUrl,
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
        await navigator.clipboard.writeText(absoluteUrl);
        alert(t('linkCopied'));
        return;
      } catch {
        // ignore
      }
    }

    try {
      window.open(absoluteUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.prompt(t('copyThisLink'), absoluteUrl);
    }
  };

  const renderMetaIcon = (type) => {
    switch (type) {
      case 'location':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 21s-6-4.8-6-10a6 6 0 0 1 12 0c0 5.2-6 10-6 10Z" />
            <circle cx="12" cy="11" r="2.5" />
          </svg>
        );
      case 'hours':
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="8" />
            <path d="M12 8v4l2.5 1.5" />
          </svg>
        );
      default:
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="5" width="16" height="15" rx="2" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M4 11h16" />
          </svg>
        );
    }
  };

  const renderTicketBadge = () => {
    const label = <span className="exposition-card__ticket-badge-label">{t('buyTickets')}</span>;
    const partner = showAffiliateNote ? (
      <span className="exposition-card__ticket-badge-sub">{t('ticketsPartnerBadge')}</span>
    ) : null;

    if (buyUrl) {
      return (
        <a
          href={buyUrl}
          target="_blank"
          rel={ticketRel}
          className="exposition-card__ticket-badge"
          aria-describedby={ctaDescribedBy}
          title={ticketHoverMessage}
          aria-label={ticketAriaLabel}
          data-affiliate={showAffiliateNote ? 'true' : undefined}
        >
          {label}
          {partner}
        </a>
      );
    }

    return (
      <span className="exposition-card__ticket-badge exposition-card__ticket-badge--disabled" aria-disabled="true">
        {label}
      </span>
    );
  };

  const renderMoreInfoCta = () => {
    if (!moreInfoUrl) return null;

    const content = (
      <>
        <span>{t('exhibitionsMoreInfoCta')}</span>
        <span className="exposition-card__overlay-cta-icon" aria-hidden="true">
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
      </>
    );

    if (isInternalMoreInfo) {
      return (
        <Link href={moreInfoUrl} prefetch className="exposition-card__overlay-cta">
          {content}
        </Link>
      );
    }

    return (
      <a href={moreInfoUrl} className="exposition-card__overlay-cta" target={moreInfoTarget} rel={moreInfoRel}>
        {content}
      </a>
    );
  };

  return (
    <article className={`exposition-card${isFavoriteBouncing ? ' is-bouncing' : ''}`}>
      <div
        className={`exposition-card__media${hasMuseumImage ? '' : ' exposition-card__media--placeholder'}`}
        aria-hidden="true"
      >
        {hasMuseumImage ? (
          isStaticMuseumImage ? (
            <Image
              src={museumImageSource}
              alt=""
              fill
              sizes="(min-width: 1280px) 340px, (min-width: 1024px) 300px, (min-width: 768px) 45vw, 100vw"
              className="exposition-card__image"
              placeholder={museumImageSource.blurDataURL ? 'blur' : undefined}
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
        <div className="exposition-card__media-overlay">
          <div className="exposition-card__overlay-top">
            {renderTicketBadge()}
            <div className="exposition-card__overlay-actions">
              {shareUrl ? (
                <button
                  type="button"
                  className="icon-button large exposition-card__icon-button"
                  aria-label={t('share')}
                  onClick={handleShare}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
                    <path d="M16 7l-4-4-4 4" />
                    <path d="M12 3v14" />
                  </svg>
                </button>
              ) : null}
              <button
                type="button"
                className={`icon-button large exposition-card__icon-button${
                  isFavorite ? ' favorited' : ''
                }${isFavoriteBouncing ? ' icon-button--bounce' : ''}`}
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
          </div>
          <div className="exposition-card__overlay-bottom">
            {renderMoreInfoCta()}
            {hasMuseumImage && hasCreditSegments && !isPublicDomainImage ? (
              <p
                className="image-credit exposition-card__image-credit exposition-card__image-credit--overlay"
                title={creditFullText || undefined}
              >
                {creditSegments.map((segment, index) => (
                  <Fragment
                    key={`${canonicalSlug || linkSlug || exposition.id}-credit-${segment.key}-${index}`}
                  >
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
        </div>
      </div>
      <div className="exposition-card__body">
        <div className="exposition-card__header">
          {secondaryTitle ? <p className="exposition-card__subtitle">{secondaryTitle}</p> : null}
          {primaryTitle ? <h3 className="exposition-card__title">{primaryTitle}</h3> : null}
        </div>
        {metaItems.length > 0 ? (
          <div className="exposition-card__meta">
            {metaItems.map((item) => (
              <div
                key={item.key}
                className={`exposition-card__meta-item exposition-card__meta-item--${item.key}`}
              >
                <span className="exposition-card__meta-icon" aria-hidden="true">
                  {renderMetaIcon(item.key)}
                </span>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        {summaryText ? <p className="exposition-card__summary">{summaryText}</p> : null}
        {activeTags.length > 0 ? (
          <ul className="exposition-card__tags">
            {activeTags.map((tag) => (
              <li key={tag.key}>
                <span className="exposition-card__tag">{tag.label}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {ticketContext ? (
        <div className="exposition-card__footer">
          <TicketButtonNote
            affiliate={showAffiliateNote}
            showIcon={false}
            id={ticketNoteId}
            className="exposition-card__affiliate-note"
          >
            {ticketContext}
          </TicketButtonNote>
        </div>
      ) : null}
    </article>
  );
}
