import { useLanguage } from './LanguageContext';

function NormalisedSocialLinks({ items }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <div className="visitor-value">
      {items.map((item) => {
        if (!item || (!item.url && !item.value)) return null;
        const key = item.url || item.value || item.label;
        const label = item.label || item.value || item.url;
        return (
          <span key={key} style={{ display: 'block' }}>
            {item.url ? (
              <a href={item.url} target="_blank" rel="noreferrer">
                {label}
              </a>
            ) : (
              label
            )}
          </span>
        );
      })}
    </div>
  );
}

export default function VisitorInfo({
  ticketUrl,
  websiteUrl,
  openingHours,
  locationLines = [],
  free = false,
  phone,
  email,
  socialLinks = [],
  imageCredit,
  showAffiliateNote = false,
  showImageCredit = false,
}) {
  const { t } = useLanguage();

  const safeLocation = Array.isArray(locationLines) ? locationLines.filter(Boolean) : [];
  const hasTicket = Boolean(ticketUrl);
  const hasWebsite = Boolean(websiteUrl);
  const hasPhone = Boolean(phone);
  const hasEmail = Boolean(email);
  const hasSocial = Array.isArray(socialLinks) && socialLinks.length > 0;
  const credit = imageCredit || null;
  const shouldRenderCredit = showImageCredit || !!credit;

  return (
    <section className="visitor-card" aria-labelledby="visitor-info-title">
      <h2 className="visitor-title" id="visitor-info-title">
        {t('visitorInformation')}
      </h2>

      {(hasTicket || hasWebsite) && (
        <div className="visitor-buttons">
          {hasTicket ? (
            <a
              href={ticketUrl}
              target="_blank"
              rel="noreferrer"
              className="visitor-btn-primary"
              title={t('affiliateLink')}
            >
              {t('buyTicket')}
              {showAffiliateNote && <small className="affiliate-note">{t('affiliateLinkLabel')}</small>}
            </a>
          ) : (
            <button type="button" className="visitor-btn-primary" disabled aria-disabled="true">
              {t('buyTicket')}
            </button>
          )}

          {hasWebsite && (
            <a href={websiteUrl} target="_blank" rel="noreferrer" className="visitor-btn-ghost">
              {t('website')}
            </a>
          )}
        </div>
      )}

      <div className="visitor-details">
        {openingHours && (
          <div>
            <span className="visitor-label">{t('openingHours')}</span>
            <p className="visitor-value">{openingHours}</p>
          </div>
        )}

        {safeLocation.length > 0 && (
          <div>
            <span className="visitor-label">{t('location')}</span>
            <p className="visitor-value">
              {safeLocation.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {line}
                  {index < safeLocation.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        )}

        {free && (
          <div>
            <span className="visitor-label">{t('visitorInformation')}</span>
            <p className="visitor-value">{t('free')}</p>
          </div>
        )}

        {hasPhone && (
          <div>
            <span className="visitor-label">{t('phone')}</span>
            <p className="visitor-value">
              <a href={`tel:${phone}`}>{phone}</a>
            </p>
          </div>
        )}

        {hasEmail && (
          <div>
            <span className="visitor-label">{t('email')}</span>
            <p className="visitor-value">
              <a href={`mailto:${email}`}>{email}</a>
            </p>
          </div>
        )}

        {hasSocial && (
          <div>
            <span className="visitor-label">{t('social')}</span>
            <NormalisedSocialLinks items={socialLinks} />
          </div>
        )}
      </div>

      {shouldRenderCredit && (
        <p className="visitor-credit">
          <span className="visitor-label" style={{ display: 'block', marginBottom: 4 }}>
            {t('imageCreditLabel')}
          </span>
          <span>
            {credit?.author || t('unknown')}
            {credit?.license ? `, ${credit.license}` : ''}
            {credit?.source && (
              <>
                {' '}
                {t('via')}{' '}
                {credit?.url ? (
                  <a href={credit.url} target="_blank" rel="noreferrer">
                    {credit.source}
                  </a>
                ) : (
                  credit.source
                )}
              </>
            )}
          </span>
        </p>
      )}
    </section>
  );
}
