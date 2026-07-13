const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');
async function load(relativePath) { return import(pathToFileURL(path.resolve(__dirname, relativePath)).href); }

async function run() {
  const { buildDiscoveryPage, getOpeningForDate, DISCOVERY_MIN_INDEXABLE_RESULTS } = await load('../lib/discoveryPages.js');
  const now = new Date('2026-07-13T10:00:00Z');
  const base = { id: '1', slug: 'a', naam: 'A', openingstijden: 'Dagelijks 10:00–17:00' };

  assert.strictEqual(buildDiscoveryPage('vandaag-open', { museums: [], now }).robots, 'noindex,follow', 'geen resultaten geeft noindex');
  assert.strictEqual(buildDiscoveryPage('vandaag-open', { museums: [base], now }).results.length, 1, 'één resultaat blijft zichtbaar');
  assert.strictEqual(buildDiscoveryPage('vandaag-open', { museums: [base], now }).robots, 'noindex,follow', 'één resultaat is dun en noindex');
  const enough = Array.from({ length: DISCOVERY_MIN_INDEXABLE_RESULTS }, (_, i) => ({ ...base, id: String(i), slug: `m${i}`, naam: `Museum ${i}` }));
  assert.strictEqual(buildDiscoveryPage('vandaag-open', { museums: enough, now }).robots, undefined, 'voldoende resultaten indexeerbaar');

  const exhibitions = [
    { id: 'old', title: 'Verlopen', end_date: '2026-07-12', verification_status: 'verified' },
    { id: 'soon', title: 'Bijna klaar', end_date: '2026-07-20', verification_status: 'verified' },
  ];
  assert.deepStrictEqual(buildDiscoveryPage('tentoonstellingen-binnenkort-eindigen', { exhibitions, museums: [], now }).results.map((x) => x.id), ['soon'], 'verlopen tentoonstelling uitgesloten');
  assert.strictEqual(buildDiscoveryPage('vandaag-open', { museums: [{ id:'x', slug:'x', naam:'X' }], now }).results.length, 0, 'onbekende openingstijden niet als open tonen');
  assert.deepStrictEqual(getOpeningForDate({ ...base, opening_exceptions: { '2026-07-13': 'closed' } }, '2026-07-13').status, 'closed', 'feestdagafwijking sluit museum');

  const a = buildDiscoveryPage('met-kinderen', { museums: enough, now });
  const b = buildDiscoveryPage('geschikt-bij-regen', { museums: enough, now });
  assert.notStrictEqual(a.config.intro, b.config.intro, 'geen dubbele SEO-intro');
  assert.strictEqual(buildDiscoveryPage('museumkaart', { museums: enough, now }).canonical, '/ontdek/museumkaart', 'canonical klopt');
  assert.strictEqual(buildDiscoveryPage('museumkaart', { museums: [], now }).robots, 'noindex,follow', 'dunne pagina noindex');
  console.log('Discovery page SEO tests passed.');
}
run().catch((e) => { console.error(e); process.exit(1); });
