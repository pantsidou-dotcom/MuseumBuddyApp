import { useLanguage } from './LanguageContext';

export default function HomeValueProps() {
  const { t } = useLanguage();

  const cards = [
    {
      key: 'curated',
      title: t('homeValueCuratedTitle'),
      description: t('homeValueCuratedDescription'),
    },
    {
      key: 'hours',
      title: t('homeValueHoursTitle'),
      description: t('homeValueHoursDescription'),
    },
    {
      key: 'favorites',
      title: t('homeValueFavoritesTitle'),
      description: t('homeValueFavoritesDescription'),
    },
    {
      key: 'planning',
      title: t('homeValuePlanningTitle'),
      description: t('homeValuePlanningDescription'),
    },
  ];

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
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
