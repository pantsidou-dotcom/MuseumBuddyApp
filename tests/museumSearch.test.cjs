const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function loadModule(relativePath) {
  const moduleUrl = pathToFileURL(path.resolve(__dirname, relativePath));
  return import(moduleUrl.href);
}

async function run() {
  const { parseMuseumSearchQuery } = await loadModule('../lib/museumSearch.js');
  const { getMuseumCategories } = await loadModule('../lib/museumCategories.js');

  const { textQuery, categoryFilters } = parseMuseumSearchQuery('Wetenschap musea in Amsterdam');

  assert.strictEqual(textQuery, 'musea in Amsterdam', 'Should retain non-category search terms');
  assert.deepStrictEqual(
    categoryFilters,
    ['science'],
    'Should map Dutch science synonym to the science category'
  );

  const sampleMuseums = [
    { slug: 'micropia-museum-amsterdam', naam: 'Micropia' },
    { slug: 'body-worlds-amsterdam', naam: 'BODY WORLDS Amsterdam' },
    { slug: 'tropenmuseum-amsterdam', naam: 'Wereldmuseum Amsterdam' },
  ];

  const filteredByCategory = sampleMuseums
    .map((museum) => ({
      ...museum,
      categories: getMuseumCategories(museum.slug),
    }))
    .filter((museum) =>
      categoryFilters.every((category) => Array.isArray(museum.categories)
        ? museum.categories.includes(category)
        : false)
    );

  const hasMicropia = filteredByCategory.some(
    (museum) => museum.slug === 'micropia-museum-amsterdam'
  );
  const hasBodyWorlds = filteredByCategory.some(
    (museum) => museum.slug === 'body-worlds-amsterdam'
  );
  const hasTropenmuseum = filteredByCategory.some(
    (museum) => museum.slug === 'tropenmuseum-amsterdam'
  );

  assert.strictEqual(
    hasMicropia,
    true,
    'Micropia should be included via the science category even without the word science'
  );
  assert.strictEqual(
    hasBodyWorlds,
    true,
    'BODY WORLDS should also be included via the science category'
  );
  assert.strictEqual(
    hasTropenmuseum,
    false,
    'Non-science museums should be filtered out when filtering by science'
  );

  console.log('Museum search parsing tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
