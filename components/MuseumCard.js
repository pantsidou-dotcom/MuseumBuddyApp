import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFavorites } from './FavoritesContext';
import { useLanguage } from './LanguageContext';
import museumSummaries from '../lib/museumSummaries';
import museumOpeningHours from '../lib/museumOpeningHours';
import { shouldShowAffiliateNote } from '../lib/nonAffiliateMuseums';
import formatImageCredit from '../lib/formatImageCredit';

const HOVER_COLORS = ['#A7D8F0', '#77DDDD', '#F7C59F', '#D8BFD8', '#EAE0C8'];

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

export default function MuseumCard({ museum }) {
  if (!museum) return null;

  const { favorites, toggleFavorite } = useFavorites();
  const { t, lang } = useLanguage();
  const isFavorite = favorites.some((f) => f.id === museum.id && f.type === 'museum');
  const hoverColor = useMemo(
    () => getHoverColor(museum.slug, museum.id),
    [museum.slug, museum.id]
  );

  const summary = museumSummaries[museum.slug]?.[lang] || museum.summary;
  const hours = museumOpeningHours[museum.slug]?.[lang];
  const locationText = [museum.city, museum.province].filter(Boolean).join(', ');
  const showAffiliateNote = Boolean(museum.ticketUrl) && shouldShowAffiliateNote(museum.slug);
  const ticketContext = t(showAffiliateNote ? 'ticketsViaPartner' : 'ticketsViaOfficialSite');

  const imageCredit = museum.imageCredit;
  const isPublicDomainImage = Boolean(imageCredit?.isPublicDomain);
  const formattedCredit = useMemo(
    () => (isPublicDomainImage ? null : formatImageCredit(imageCredit, t)),
    [imageCredit, isPublicDomainImage, t]
  );
  const creditText = formattedCredit?.text || '';
  const creditLicense = formattedCredit?.licenseLabel || '';
  const creditLicenseUrl = formattedCredit?.licenseUrl || '';
  const showCreditText = Boolean(creditText);
  const showCreditLicense = Boolean(creditLicense);
  const showCreditSource = !isPublicDomainImage && Boolean(imageCredit?.source);

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
    <article className="museum-card" style={{ '--hover-bg': hoverColor }}>
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
          {museum.ticketUrl ? (
            <a
              href={museum.ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="ticket-button"
            >
              <span className="ticket-button__label">{t('buyTickets')}</span>
              <span className="ticket-button__note">{ticketContext}</span>
            </a>
          ) : (
            <button type="button" className="ticket-button" disabled aria-disabled="true">
              <span className="ticket-button__label">{t('buyTickets')}</span>
            </button>
          )}
        </div>
        <div className="museum-card-actions">
          <button className="icon-button" aria-label={t('share')} onClick={shareMuseum}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
              <path d="M16 6l-4-4-4 4" />
              <path d="M12 2v14" />
            </svg>
          </button>
          <button
            className={`icon-button${isFavorite ? ' favorited' : ''}${
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
              aria-hidden="true"
            >
              <path d="M21 8.25c0 4.556-9 11.25-9 11.25S3 12.806 3 8.25a5.25 5.25 0 0 1 9-3.676A5.25 5.25 0 0 1 21 8.25Z" />
            </svg>
          </button>
        </div>
      </div>
      {!isPublicDomainImage && museum.image && (
        <p className="image-credit">
          <span className="image-credit-label">{t('imageCreditLabel')}</span>
          <span aria-hidden="true" className="image-credit-separator">•</span>
          {showCreditText || showCreditLicense || showCreditSource ? (
            <>
              {showCreditText && (
                <span className="image-credit-definition">{creditText}</span>
              )}
              {showCreditLicense && (
                <>
                  {showCreditText && (
                    <span aria-hidden="true" className="image-credit-divider">•</span>
                  )}
                  {creditLicenseUrl ? (
                    <a
                      className="image-credit-link"
                      href={creditLicenseUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {creditLicense}
                    </a>
                  ) : (
                    <span className="image-credit-definition">{creditLicense}</span>
                  )}
                </>
              )}
              {showCreditSource && (
                <>
                  {(showCreditText || showCreditLicense) && (
                    <span aria-hidden="true" className="image-credit-divider">•</span>
                  )}
                  {imageCredit?.url ? (
                    <a
                      className="image-credit-link"
                      href={imageCredit.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {imageCredit.source}
                    </a>
                  ) : (
                    <span className="image-credit-definition">{imageCredit?.source}</span>
                  )}
                </>
              )}
            </>
          ) : (
            <span className="image-credit-definition">{t('unknown')}</span>
          )}
        </p>
      )}
      <div className="museum-card-info">
        <h3 className="museum-card-title">
          <Link
            href={{ pathname: '/museum/[slug]', query: { slug: museum.slug } }}
            style={{ color: 'inherit', textDecoration: 'none' }}
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
      </div>
    </article>
  );
}
