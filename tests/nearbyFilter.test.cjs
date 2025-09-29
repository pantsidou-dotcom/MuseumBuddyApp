const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function loadModule() {
  const moduleUrl = pathToFileURL(path.resolve(__dirname, '../lib/museumFilters.js'));
  return import(moduleUrl.href);
}

async function run() {
  const { filterMuseumsForDisplay } = await loadModule();

  const museums = [
    { id: 1, slug: 'museum-a', naam: 'Museum A', afstand_meter: 120 },
    { id: 2, slug: 'museum-b', naam: 'Museum B', afstand_meter: null },
  ];

  const filtered = filterMuseumsForDisplay(museums, {
    excludeSlugs: [],
    onlyKidFriendly: false,
    isNearbyActive: true,
    isKidFriendlyCheck: () => true,
  });

  assert.strictEqual(filtered.length, museums.length, 'Nearby results should remain visible');
  assert(
    filtered.some((museum) => museum.afstand_meter === 120),
    'Museums with calculated distance should be present'
  );
  assert(
    filtered.some((museum) => museum.afstand_meter === null),
    'Museums without a distance fallback should not be filtered out on the client'
  );

  console.log('Nearby filter results remain visible.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
