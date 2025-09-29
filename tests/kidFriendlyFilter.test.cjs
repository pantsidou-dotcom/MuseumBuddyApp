const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function loadKidFriendlyModule() {
  const moduleUrl = pathToFileURL(path.resolve(__dirname, '../lib/kidFriendlyMuseums.js'));
  return import(moduleUrl.href);
}

async function run() {
  const module = await loadKidFriendlyModule();
  const { default: kidFriendlyMuseums, isKidFriendly } = module;

  assert(Array.isArray(kidFriendlyMuseums), 'Kid-friendly museums list should be an array');
  assert(
    kidFriendlyMuseums.includes('nemo-science-museum-amsterdam'),
    'Kid-friendly list should include NEMO Science Museum'
  );
  assert(
    kidFriendlyMuseums.includes('micropia-museum-amsterdam'),
    'Kid-friendly list should include Micropia'
  );
  assert(
    kidFriendlyMuseums.includes('scheepvaartmuseum-amsterdam'),
    'Kid-friendly list should include Het Scheepvaartmuseum'
  );
  assert(
    kidFriendlyMuseums.includes('straat-museum-amsterdam'),
    'Kid-friendly list should include STRAAT Museum'
  );
  assert(
    kidFriendlyMuseums.includes('kattenkabinet-amsterdam'),
    'Kid-friendly list should include Het Kattenkabinet'
  );

  const slugSet = new Set(kidFriendlyMuseums.map((slug) => slug.toLowerCase()));

  const sampleMuseums = [
    { slug: 'nemo-science-museum-amsterdam', kindvriendelijk: false },
    { slug: 'micropia-museum-amsterdam', kindvriendelijk: 0 },
    { slug: 'scheepvaartmuseum-amsterdam', kindvriendelijk: 0 },
    { slug: 'straat-museum-amsterdam', childFriendly: '' },
    { slug: 'kattenkabinet-amsterdam', familyFriendly: null },
    { slug: 'another-museum', kindvriendelijk: false },
  ];

  const filtered = sampleMuseums.filter((museum) => isKidFriendly(museum, slugSet));

  assert(
    filtered.some((museum) => museum.slug === 'nemo-science-museum-amsterdam'),
    'NEMO should pass the kid-friendly filter even without a true flag'
  );
  assert(
    filtered.some((museum) => museum.slug === 'micropia-museum-amsterdam'),
    'Micropia should pass the kid-friendly filter even without a true flag'
  );
  assert(
    filtered.some((museum) => museum.slug === 'scheepvaartmuseum-amsterdam'),
    'Het Scheepvaartmuseum should pass the kid-friendly filter even without a true flag'
  );
  assert(
    filtered.some((museum) => museum.slug === 'straat-museum-amsterdam'),
    'STRAAT Museum should pass the kid-friendly filter even without a true flag'
  );
  assert(
    filtered.some((museum) => museum.slug === 'kattenkabinet-amsterdam'),
    'Het Kattenkabinet should pass the kid-friendly filter even without a true flag'
  );
  assert.strictEqual(
    filtered.some((museum) => museum.slug === 'another-museum'),
    false,
    'Museums without the flag or fallback slug should not pass the kid-friendly filter'
  );

  console.log('Kid-friendly filter tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
