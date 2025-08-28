/**
 * Logic functions for museum data.
 * This module contains pure JavaScript that can be shared with React Native.
 */

/**
 * Format a museum object for display.
 * @param {{name: string, city: string}} museum
 * @returns {string}
 */
export function formatMuseum(museum) {
  return `${museum.name} – ${museum.city}`;
}

/**
 * Example list of museums.
 * Can be reused in React Native environments without modification.
 */
export const sampleMuseums = [
  { name: 'Rijksmuseum', city: 'Amsterdam' },
  { name: 'Louvre', city: 'Paris' },
];
