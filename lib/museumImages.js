// lib/museumImages.js

/**
 * Return a representative external image URL for a museum based on its slug.
 * URLs point to openly licensed photos hosted elsewhere so that the app does
 * not copy or host the images itself. Unknown slugs fall back to a placeholder
 * from picsum.photos.
 *
 * @param {string} slug - Museum slug
 * @returns {string} external image URL
 */
const museumImages = {
  'rijksmuseum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Rijksmuseum_Amsterdam_2016.jpg/640px-Rijksmuseum_Amsterdam_2016.jpg',
  'van-gogh-museum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Van_Gogh_Museum_%28Amsterdam%29_2015-07-23.jpg/640px-Van_Gogh_Museum_%28Amsterdam%29_2015-07-23.jpg',
  'stedelijk-museum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Stedelijk_Museum_Amsterdam_2016.jpg/640px-Stedelijk_Museum_Amsterdam_2016.jpg',
  'nemo-science-museum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/NEMO_Science_Museum.jpg/640px-NEMO_Science_Museum.jpg',
  'joods-museum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/63/Joods_Historisch_Museum.jpg/640px-Joods_Historisch_Museum.jpg',
  'scheepvaartmuseum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Het_Scheepvaartmuseum_%28Amsterdam%29_06.jpg/640px-Het_Scheepvaartmuseum_%28Amsterdam%29_06.jpg',
  'eye-filmmuseum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Eye_Film_Institute_Netherlands_at_sunset%2C_August_2014.jpg/640px-Eye_Film_Institute_Netherlands_at_sunset%2C_August_2014.jpg',
  'foam-fotografiemuseum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Foam_Fotografiemuseum_Amsterdam.jpg/640px-Foam_Fotografiemuseum_Amsterdam.jpg',
  'moco-museum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Moco_Museum_Amsterdam.jpg/640px-Moco_Museum_Amsterdam.jpg',
  'straat-museum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/STRAAT_Museum_in_Amsterdam.jpg/640px-STRAAT_Museum_in_Amsterdam.jpg',
  'amsterdam-museum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Amsterdam_Museum.jpg/640px-Amsterdam_Museum.jpg',
  'wereldmuseum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Tropenmuseum_Amsterdam_2015.jpg/640px-Tropenmuseum_Amsterdam_2015.jpg',
  'tropenmuseum-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fb/Tropenmuseum_Amsterdam_2015.jpg/640px-Tropenmuseum_Amsterdam_2015.jpg',
  'huis-marseille-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Huis_Marseille_Museum_for_Photography_Amsterdam.jpg/640px-Huis_Marseille_Museum_for_Photography_Amsterdam.jpg',
  'rembrandthuis-amsterdam':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Rembrandthuis_in_Amsterdam.jpg/640px-Rembrandthuis_in_Amsterdam.jpg',
};

export default function museumImageUrl(slug) {
  return (
    museumImages[slug] || `https://picsum.photos/seed/${slug}/600/400`
  );
}

