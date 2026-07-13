const assert = require('assert');
const path = require('path');
const { pathToFileURL } = require('url');

async function loadModule(relativePath) {
  return import(pathToFileURL(path.resolve(__dirname, relativePath)).href);
}

async function run() {
  const {
    normalizeExhibitionDates,
    shouldShowAsCurrent,
    buildExhibitionArchiveUpdate,
    groupExhibitionsByDateStatus,
  } = await loadModule('../lib/exhibitionStatus.js');
  const today = '2026-07-13';
  const opts = { today, timeZone: 'Europe/Amsterdam', now: new Date('2026-07-13T10:00:00.000Z') };

  assert.strictEqual(normalizeExhibitionDates({ end_date: '2026-07-12' }, opts).date_status, 'ended', 'einddatum gisteren');
  assert.strictEqual(shouldShowAsCurrent({ end_date: '2026-07-12' }, opts), false, 'gisteren niet actueel');
  assert.strictEqual(normalizeExhibitionDates({ end_date: '2026-07-13' }, opts).date_status, 'current', 'einddatum vandaag');
  assert.strictEqual(shouldShowAsCurrent({ end_date: '2026-07-13' }, opts), true, 'vandaag nog actueel');
  assert.strictEqual(normalizeExhibitionDates({ end_date: '2026-07-14' }, opts).date_status, 'current', 'einddatum morgen');
  assert.strictEqual(normalizeExhibitionDates({ start_date: '2026-07-01' }, opts).date_status, 'unknown', 'geen einddatum onbekend');
  assert.strictEqual(shouldShowAsCurrent({ start_date: '2026-07-01' }, opts), false, 'geen einddatum niet automatisch actueel');
  assert.strictEqual(shouldShowAsCurrent({ verification_status: 'verified' }, opts), true, 'geverifieerd zonder einddatum mag actueel');
  assert.strictEqual(normalizeExhibitionDates({ is_permanent: true }, opts).date_status, 'permanent', 'permanente tentoonstelling');
  assert.strictEqual(shouldShowAsCurrent({ date_status: 'unknown' }, opts), false, 'onbekende status niet actueel');
  assert.strictEqual(normalizeExhibitionDates({ end_date: '2026-07-13T23:30:00-10:00' }, opts).end_date, '2026-07-13', 'verschillende tijdzones datumdeel stabiel');

  const first = buildExhibitionArchiveUpdate({ id: 1, end_date: '2026-07-12' }, opts);
  const second = buildExhibitionArchiveUpdate({ id: 1, end_date: '2026-07-12', archived_at: first.archived_at }, opts);
  assert.strictEqual(first.date_status, 'ended', 'cron markeert verlopen');
  assert.ok(first.archived_at, 'cron archiveert verlopen');
  assert.strictEqual(second.archived_at, undefined, 'cron opnieuw uitvoeren is idempotent');
  assert.strictEqual(buildExhibitionArchiveUpdate({ id: 2, end_date: '2026-07-12', archived_at: '2026-07-12T00:00:00Z' }, opts).archived_at, undefined, 'reeds gearchiveerd record blijft staan');

  const grouped = groupExhibitionsByDateStatus([
    { id: 'card-current', startDate: '2026-07-01', verificationStatus: 'verified' },
    { id: 'card-permanent', isPermanent: true },
    { id: 'card-scheduled', startDate: '2026-07-14', endDate: '2026-08-01' },
  ], opts);
  assert.deepStrictEqual(grouped.current.map((item) => item.id), ['card-current'], 'frontend kaart met camelCase datums blijft zichtbaar');
  assert.deepStrictEqual(grouped.permanent.map((item) => item.id), ['card-permanent'], 'frontend kaart met camelCase permanent blijft zichtbaar');
  assert.deepStrictEqual(grouped.scheduled.map((item) => item.id), ['card-scheduled'], 'frontend kaart met camelCase planning blijft zichtbaar');

  console.log('Exhibition lifecycle tests passed.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
