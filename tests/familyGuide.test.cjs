const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

(async () => {
  const mod = await import(pathToFileURL(path.resolve(__dirname, '../lib/familyGuide.js')));
  assert.strictEqual(mod.FAMILY_GUIDE_PATH, '/museumgids/kindvriendelijke-musea-amsterdam');
  assert(mod.LEGACY_FAMILY_GUIDE_PATHS.includes('/kindvriendelijke-musea-amsterdam'));
  assert.strictEqual(mod.familyMuseumProfiles.filter((p) => ['verified','partially_verified'].includes(p.familyVerificationStatus)).length >= 5, true);
  assert.strictEqual(mod.getFamilyGuideIndexabilityStatus().indexable, true);
  assert.strictEqual(mod.getFamilyGuideIndexabilityStatus([{familyFriendly:true,familyVerificationStatus:'needs_review'}]).robots, 'noindex, follow');
  assert(mod.getProfilesByAgeGroup('0-3').some((p) => p.slug === 'eye-filmmuseum-amsterdam'));
  assert.strictEqual(mod.getProfilesByAgeGroup('unknown').length, 0);
  assert.strictEqual(mod.getFamilyGuideIndexabilityStatus([{...mod.familyMuseumProfiles[0], temporaryFamilyProgramme:'x', temporaryProgrammeEndDate:'2026-01-01'}]).indexable, false);
  assert.strictEqual(mod.getFamilyGuideIndexabilityStatus([{...mod.familyMuseumProfiles[0], familySourceUrl:null}]).indexable, false);
  const safe = mod.getSafeFamilyAnalyticsPayload({ museumCode:'nemo', affiliateId:'abc', fullUrl:'https://x.test/?partner=abc', ageCategory:'7-9' });
  assert.deepStrictEqual(Object.keys(safe).sort(), ['ageCategory','museumCode']);

  const page = fs.readFileSync(path.resolve(__dirname, '../pages/museumgids/kindvriendelijke-musea-amsterdam.js'), 'utf8');
  assert(page.includes('FAMILY_GUIDE_TITLE'));
  assert.strictEqual((page.match(/<h1/g) || []).length, 1);
  assert(page.includes('BreadcrumbList'));
  assert(page.includes('FAQPage'));
  assert(page.includes('rel={profile.ticketPartnerCategory === \'affiliate\' ? \'sponsored noopener noreferrer\''));
  assert(page.includes("t('affiliateDisclaimer')"));
  assert(page.includes('role="tablist"'));
  assert(page.includes('family_ticket_cta_clicked'));

  const vercelConfig = fs.readFileSync(path.resolve(__dirname, '../vercel.json'), 'utf8');
  assert(vercelConfig.includes('/kindvriendelijk'));
  assert(vercelConfig.includes('/ontdek/met-kinderen'));

  const legacy = fs.readFileSync(path.resolve(__dirname, '../pages/kindvriendelijke-musea-amsterdam.js'), 'utf8');
  assert(legacy.includes('noindex, follow'));
  assert(legacy.includes('httpEquiv="refresh"'));

  const sitemapScript = fs.readFileSync(path.resolve(__dirname, '../scripts/generateSeoFiles.mjs'), 'utf8');
  assert(sitemapScript.includes('/museumgids/kindvriendelijke-musea-amsterdam'));
  assert(sitemapScript.includes("'/kindvriendelijke-musea-amsterdam',"));

  const footer = fs.readFileSync(path.resolve(__dirname, '../components/Footer.js'), 'utf8');
  assert(footer.includes('/museumgids/kindvriendelijke-musea-amsterdam'));
})();
