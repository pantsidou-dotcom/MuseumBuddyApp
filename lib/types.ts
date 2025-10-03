import type { StaticImageData } from 'next/image';

export type Museum = {
  id: string;
  slug: string;
  name: string;
  city: string;
  summary: string;
  image: StaticImageData | string;
  badges?: string[];
  websiteUrl?: string;
  ticketUrl?: string;
};

export type Exhibition = {
  id: string;
  slug: string;
  title: string;
  museumId: string;
  museumSlug: string;
  image?: StaticImageData | string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  tags?: string[];
  ticketUrl?: string;
};

export type CardImage = {
  src: StaticImageData | string;
  alt: string;
};

export type EntityCardData = {
  id: string;
  variant: 'museum' | 'exhibition';
  href: string;
  prefetchHref?: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: CardImage;
  badges?: string[];
  ctaLabel?: string;
};
