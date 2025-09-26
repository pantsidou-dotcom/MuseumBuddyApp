import { useLanguage } from './LanguageContext';

export default function HomeValueProps({ partnerLogos = [] }) {
  const { t } = useLanguage();

  const cards = [
    {
      key: 'curated',
      icon: '🌟',
      title: t('homeValueCuratedTitle'),
      description: t('homeValueCuratedDescription'),
    },
    {
      key: 'hours',
      icon: '🕰️',
      title: t('homeValueHoursTitle'),
      description: t('homeValueHoursDescription'),
    },
    {
      key: 'favorites',
      icon: '💖',
      title: t('homeValueFavoritesTitle'),
      description: t('homeValueFavoritesDescription'),
    },
    {
      key: 'planning',
      icon: '🗺️',
      title: t('homeValuePlanningTitle'),
      description: t('homeValuePlanningDescription'),
    },
  ];

  const logos = Array.isArray(partnerLogos)
    ? partnerLogos.filter((partner) => Boolean(partner?.label))
    : [];

  return (
    <section className="home-value-props" aria-labelledby="home-value-props-heading">
      <div className="home-value-props__intro">
        <span className="home-value-tag">{t('homeValueTag')}</span>
        <h2 id="home-value-props-heading" className="home-value-heading">
          {t('homeValueHeading')}
        </h2>
        <p className="home-value-subheading">{t('homeValueSubheading')}</p>
      </div>

      <div className="home-value-cards" role="list">
        {cards.map((card) => (
          <article key={card.key} className="home-value-card" role="listitem">
            <div className="home-value-icon" aria-hidden="true">
              <span>{card.icon}</span>
            </div>
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </div>

      <div className="home-value-footer">
        <figure className="home-value-testimonial">
          <blockquote>{t('homeValueTestimonialQuote')}</blockquote>
          <figcaption>
            <span className="home-value-testimonial__name">{t('homeValueTestimonialName')}</span>
            <span className="home-value-testimonial__role">{t('homeValueTestimonialRole')}</span>
          </figcaption>
        </figure>

        {logos.length > 0 && (
          <div className="home-partner-strip" aria-label={t('homePartnerStripLabel')}>
            {logos.map((partner) => (
              <span key={partner.label} className="home-partner-chip">
                {partner.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
