import { forwardRef } from 'react';
import styles from '../styles/ui.module.css';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function createComponent(defaultTag, baseClass, options = {}) {
  const { isButton = false } = options;
  return forwardRef(function StyledComponent({ as, className, ...props }, ref) {
    const Tag = as || defaultTag;
    const combinedClassName = cx(baseClass, className);
    const finalProps = { ...props };

    if (isButton && props && props.type === undefined && typeof Tag === 'string' && Tag === 'button') {
      finalProps.type = 'button';
    }

    return <Tag ref={ref} className={combinedClassName || undefined} {...finalProps} />;
  });
}

export const Topbar = createComponent('header', styles.topbar);
export const TopbarInner = createComponent('div', styles.topbarInner);
export const Logo = createComponent('div', styles.logo);
export const IconRow = createComponent('div', styles.iconRow);
export const IconBtn = createComponent('button', styles.iconBtn, { isButton: true });
export const FavoriteBadge = createComponent('span', styles.favoriteBadge);

export const SearchRow = createComponent('div', styles.searchRow);
export const SearchInput = createComponent('input', styles.searchInput);
export const FilterBtn = createComponent('button', styles.filterBtn, { isButton: true });

export const PageHeader = createComponent('div', styles.pageHeader);
export const SectionHeader = createComponent('div', styles.sectionHeader);
export const ChipIcon = createComponent('button', styles.chipIcon, { isButton: true });

export const ExpositionList = createComponent('div', styles.expoList);
export const ExpoCard = createComponent('article', styles.expoCard);
export const Fab = createComponent('button', styles.fab, { isButton: true });
export const ExpoMeta = createComponent('div', styles.expoMeta);
export const ExpoTitle = createComponent('h3', styles.expoTitle);
export const CTA = createComponent('button', styles.cta, { isButton: true });

export const VisitorCard = createComponent('section', styles.visitorCard);
export const VisitorTitle = createComponent('h3', styles.visitorTitle);
export const ButtonRow = createComponent('div', styles.buttonRow);
export const PrimaryLink = createComponent('a', styles.primaryLink);
export const GhostLink = createComponent('a', styles.ghostLink);
export const Label = createComponent('div', styles.label);
export const Value = createComponent('p', styles.value);
export const Credit = createComponent('p', styles.credit);

export const PageSurface = createComponent('div', styles.pageSurface);
export const PageContainer = createComponent('div', styles.pageContainer);
export const SectionSpacing = createComponent('div', styles.sectionSpacing);
export const FooterText = createComponent('footer', styles.footer);

export const FilterBackdrop = createComponent('div', styles.filterBackdrop);
export const FilterSheet = createComponent('div', styles.filterSheet);
export const FilterHeader = createComponent('div', styles.filterHeader);
export const FilterTitle = createComponent('h3', styles.filterTitle);
export const FilterClose = createComponent('button', styles.filterClose, { isButton: true });
export const FilterBody = createComponent('div', styles.filterBody);
export const FilterOption = createComponent('label', styles.filterOption);
export const FilterActions = createComponent('div', styles.filterActions);
export const SheetPrimaryButton = createComponent('button', styles.sheetPrimaryButton, { isButton: true });
export const SheetSecondaryButton = createComponent('button', styles.sheetSecondaryButton, { isButton: true });

export const EmptyState = createComponent('p', styles.emptyState);

export const fabActiveClass = styles.fabActive;
export const ctaDisabledClass = styles.ctaDisabled;
