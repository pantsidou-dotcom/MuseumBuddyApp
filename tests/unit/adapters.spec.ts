import { describe, it, expect } from 'vitest';
import { mapExhibitionToCardData } from '@/lib/adapters';
import type { Exhibition, Museum } from '@/lib/types';

describe('mapExhibitionToCardData', () => {
  it('falls back to the museum image when the exhibition has no image', () => {
    const museum: Museum = {
      id: 'museum-1',
      slug: 'museum-1',
      name: 'Museum 1',
      city: 'Amsterdam',
      summary: 'Samenvatting',
      image: '/images/museum.jpg',
    };

    const exhibition: Exhibition = {
      id: 'exhibition-1',
      slug: 'exhibition-1',
      title: 'Expositie',
      museumId: 'museum-1',
      museumSlug: 'museum-1',
      summary: 'Beschrijving',
    };

    const card = mapExhibitionToCardData(exhibition, { 'museum-1': museum });

    expect(card.image.src).toBe(museum.image);
    expect(card.subtitle).toBe(museum.name);
  });
});
