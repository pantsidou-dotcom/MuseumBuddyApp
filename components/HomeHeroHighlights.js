import Link from 'next/link';
import { useMemo } from 'react';
import { useLanguage } from './LanguageContext';
import museumNames from '../lib/museumNames';

const MAX_HIGHLIGHTS = 3;

export default function HomeHeroHighlights({ museums = [] }) {
  const { t } = useLanguage();

  const highlightedMuseums = useMemo(() => {
    return museums
      .filter(Boolean)
      .slice(0, MAX_HIGHLIGHTS)
      .map((museum) => ({
        slug: museum.slug,
        title: museumNames[museum.slug] || museum.naam,
        city: museum.stad,
        free: Boolean(museum.gratis_toegankelijk),
      }));
  }, [museums]);

  if (!highlightedMuseums.length) {
    return null;
  }

  return (
    <aside className="hero-highlights" aria-label={t('heroHighlightsAriaLabel')}>
      <div className="hero-highlights__header">
        <span className="hero-highlights__eyebrow">{t('heroHighlightsEyebrow')}</span>
        <h2 className="hero-highlights__title">{t('heroHighlightsTitle')}</h2>
        <p className="hero-highlights__subtitle">{t('heroHighlightsSubtitle')}</p>
      </div>
      <ul className="hero-highlights__list">
        {highlightedMuseums.map((museum) => (
          <li key={museum.slug} className="hero-highlights__item">
            <Link href={`/musea/${museum.slug}`} className="hero-highlight-card">
              <div className="hero-highlight-card__meta">
                <span className="hero-highlight-card__city">{museum.city || t('unknown')}</span>
                {museum.free && <span className="hero-highlight-card__tag">{t('heroHighlightFreeTag')}</span>}
              </div>
              <span className="hero-highlight-card__name">{museum.title}</span>
              <span className="hero-highlight-card__cta">
                {t('heroHighlightCta')}
                <svg
                  aria-hidden="true"
                  className="hero-highlight-card__icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
