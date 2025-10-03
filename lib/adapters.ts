import type { Exhibition, Museum, EntityCardData } from './types';

const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'long',
});

function formatDateRange(start?: string, end?: string) {
  if (!start && !end) {
    return undefined;
  }

  if (start && end) {
    const startLabel = dateFormatter.format(new Date(start));
    const endLabel = dateFormatter.format(new Date(end));
    return `${startLabel} – ${endLabel}`;
  }

  if (start) {
    return `Vanaf ${dateFormatter.format(new Date(start))}`;
  }

  if (end) {
    return `Tot ${dateFormatter.format(new Date(end))}`;
  }

  return undefined;
}

export function mapMuseumToCardData(museum: Museum): EntityCardData {
  return {
    id: museum.id,
    variant: 'museum',
    href: `/museum/${museum.slug}`,
    prefetchHref: `/museum/${museum.slug}`,
    title: museum.name,
    subtitle: museum.city,
    description: museum.summary,
    image: {
      src: museum.image,
      alt: museum.name,
    },
    badges: museum.badges,
    ctaLabel: museum.ticketUrl ? 'Koop tickets' : 'Bekijk museum',
  };
}

export function mapExhibitionToCardData(
  exhibition: Exhibition,
  museumsById: Record<string, Museum>
): EntityCardData {
  const museum = museumsById[exhibition.museumId];
  const imageSource = exhibition.image ?? museum?.image;

  const href = museum
    ? `/museum/${museum.slug}#tentoonstellingen`
    : `/tentoonstellingen/${exhibition.slug}`;

  const descriptionParts = [exhibition.summary, formatDateRange(exhibition.startDate, exhibition.endDate)].filter(
    Boolean
  ) as string[];

  return {
    id: exhibition.id,
    variant: 'exhibition',
    href,
    prefetchHref: href,
    title: exhibition.title,
    subtitle: museum?.name,
    description: descriptionParts.join(' • '),
    image: {
      src: imageSource ?? '/images/exposition-placeholder.svg',
      alt: exhibition.title,
    },
    badges: exhibition.tags,
    ctaLabel: museum ? 'Bekijk museum' : 'Meer info',
  };
}
