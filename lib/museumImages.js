// lib/museumImages.js

/**
 * Generate an external image URL for a museum based on its slug. Images are
 * provided by picsum.photos which serves placeholder photos and allows us to
 * avoid hosting any files ourselves.
 *
 * @param {string} slug - Museum slug
 * @returns {string} external image URL
 */
export default function museumImageUrl(slug) {
  return `https://picsum.photos/seed/${slug}/600/400`;
}

