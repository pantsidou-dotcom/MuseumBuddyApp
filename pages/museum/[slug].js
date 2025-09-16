import SEO from '../../components/SEO';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import museumImages from '../../lib/museumImages';
import museumNames from '../../lib/museumNames';
import museumImageCredits from '../../lib/museumImageCredits';
import museumOpeningHours from '../../lib/museumOpeningHours';
import museumTicketUrls from '../../lib/museumTicketUrls';
import ExpositionCard from '../../components/ExpositionCard';
import { useLanguage } from '../../components/LanguageContext';
import { useFavorites } from '../../components/FavoritesContext';
import { shouldShowAffiliateNote } from '../../lib/nonAffiliateMuseums';

function formatDate(d, locale) {
  if (!d) return '';
  try {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
}

function todayYMD(tz = 'Europe/Amsterdam') {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date());
}

export default function MuseumDetail({ museum, exposities, error }) {
  const { lang, t } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const locale = lang === 'en' ? 'en-GB' : 'nl-NL';

  if (error) {
    const errorTitle = 'Museum — MuseumBuddy';
    return (
      <>
        <SEO title={errorTitle} />
        <main style={{ maxWidth: 800, margin: '2rem auto', padding: '0 1rem' }}>
          <p>{t('somethingWrong')}</p>
          <a href="/" style={{ display: 'inline-block', marginTop: '1rem' }}>
            &larr; {t('back')}
          </a>
        </main>
      </>
    );
  }

  const name = museum ? museumNames[museum.slug] || museum.naam : '';
  const openingHours = museum ? museumOpeningHours[museum.slug]?.[lang] : null;
  const credit = museum ? museumImageCredits[museum.slug] : null;
  const ticketUrl = museum ? museum.ticket_affiliate_url || museum.website_url : null;
  const heroImage = museum ? museumImages[museum.slug] : null;
  const hasHeroImage = Boolean(heroImage);
  const locationText = museum
    ? [museum.stad, museum.provincie].filter(Boolean).join(', ')
    : '';
  const showAffiliateNote = museum ? shouldShowAffiliateNote(museum.slug) : true;
  const museumItem =
    museum && name
      ? {
          id: museum.id,
          slug: museum.slug,
          title: name,
          image: heroImage,
          ticketUrl,
        }
      : null;
  const isFavorite = museumItem
    ? favorites.some((f) => f.id === museum.id && f.type === 'museum')
    : false;

  const handleFavorite = () => {
    if (museumItem) {
      toggleFavorite({ ...museumItem, type: 'museum' });
    }
  };

  return (
    <>
      <SEO
        title={name ? `${name} — MuseumBuddy` : 'Museum — MuseumBuddy'}
        description={t('museumDescription', { name: name || 'museum' })}
      />

      <main className={`museum-detail${hasHeroImage ? ' has-hero' : ''}`}>
        {hasHeroImage && (
          <section className="museum-detail-hero">
            <Image
              src={heroImage}
              alt={name}
              fill
              priority
              sizes="100vw"
              className="museum-hero-image"
            />
          </section>
        )}

        <div className="museum-detail-container container">
          <a href="/" className="backlink museum-backlink">
            &larr; {t('back')}
          </a>

          <div className="museum-detail-grid">
            <section className="museum-expositions">
              <div className="museum-expositions-card">
                <div className="museum-detail-header">
                  <div>
                    <h1 className="detail-title">{name}</h1>
                    {locationText && <p className="detail-sub">{locationText}</p>}
                  </div>
                  <div className="museum-detail-actions">
                    {museumItem && (
                      <button
                        className={`icon-button large${isFavorite ? ' favorited' : ''}`}
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
                    )}
                  </div>
                </div>

                <div className="museum-expositions-body">
                  <h2 className="museum-expositions-heading">{t('expositionsTitle')}</h2>
                  {!exposities || exposities.length === 0 ? (
                    <p className="museum-expositions-empty">{t('noExpositions')}</p>
                  ) : (
                    <ul className="events-list">
                      {exposities.map((e) => (
                        <li key={e.id}>
                          <ExpositionCard
                            exposition={e}
                            ticketUrl={ticketUrl}
                            museumSlug={museum.slug}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            <aside className="museum-sidebar">
              <div className="museum-sidebar-card">
                <h2 className="museum-sidebar-title">{t('visitorInformation')}</h2>
                <div className="museum-info-links">
                  {museum.website_url && (
                    <a
                      href={museum.website_url}
                      target="_blank"
                      rel="noreferrer"
                      className="museum-info-link"
                    >
                      {t('website')}
                    </a>
                  )}
                  {museum.ticket_affiliate_url && (
                    <a
                      href={ticketUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="museum-info-link primary"
                      title={t('affiliateLink')}
                    >
                      {t('tickets')}
                      {showAffiliateNote && (
                        <span className="affiliate-note">{t('affiliateLinkLabel')}</span>
                      )}
                    </a>
                  )}
                </div>
                <div className="museum-info-details">
                  {locationText && (
                    <div className="museum-info-item">
                      <span className="museum-info-label">{t('location')}</span>
                      <p className="museum-info-value">{locationText}</p>
                    </div>
                  )}
                  {openingHours && (
                    <div className="museum-info-item">
                      <span className="museum-info-label">{t('openingHours')}</span>
                      <p className="museum-info-value">{openingHours}</p>
                    </div>
                  )}
                </div>
                {hasHeroImage && (
                  <p className="museum-info-credit">
                    <span className="museum-info-credit-label">{t('imageCreditLabel')}:</span>{' '}
                    {credit ? (
                      <>
                        {credit.author}
                        {credit.license ? `, ${credit.license}` : ''}
                        {credit.source && (
                          <>
                            {' '}
                            {t('via')}{' '}
                            {credit.url ? (
                              <a href={credit.url} target="_blank" rel="noreferrer">
                                {credit.source}
                              </a>
                            ) : (
                              credit.source
                            )}
                          </>
                        )}
                      </>
                    ) : (
                      t('unknown')
                    )}
                  </p>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getServerSideProps(context) {
  const { slug } = context.params || {};
  if (slug === 'amsterdam-tulip-museum-amsterdam') {
    return { notFound: true };
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    context.res.statusCode = 500;
    return { props: { museum: null, exposities: [], error: true } };
  }

  const supabase = createClient(url, anon);

  const { data: museum, error: museumError } = await supabase
    .from('musea')
    .select('id, naam, stad, provincie, website_url, ticket_affiliate_url, slug')
    .eq('slug', slug)
    .single();

  if (museumError) {
    if (museumError.code === 'PGRST116') {
      return { notFound: true };
    }
    context.res.statusCode = 500;
    return { props: { museum: null, exposities: [], error: true } };
  }

  museum.ticket_affiliate_url =
    museum.ticket_affiliate_url || museumTicketUrls[museum.slug];

  const today = todayYMD('Europe/Amsterdam'); // "YYYY-MM-DD"
  const { data: exposities, error: exError } = await supabase
    .from('exposities')
    .select('id, titel, start_datum, eind_datum, bron_url')
    .eq('museum_id', museum.id)
    .or(`eind_datum.gte.${today},eind_datum.is.null`)
    .order('start_datum', { ascending: true, nullsFirst: false });

  if (exError) {
    context.res.statusCode = 500;
    return { props: { museum: null, exposities: [], error: true } };
  }

  return {
    props: {
      museum,
      exposities: exposities || [],
      error: false,
    },
  };
}
