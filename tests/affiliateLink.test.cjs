const fs = require('fs');
const assert = require('assert');

const translationsContent = fs.readFileSync('lib/translations.js', 'utf8');
assert(/affiliateLink:\s*'This link goes to our Affiliate Partner\. Prices may vary\.'/.test(translationsContent), 'English translation missing');
assert(/affiliateLink:\s*'Deze link gaat naar onze Affiliate Partner\. Prijzen kunnen afwijken\.'/.test(translationsContent), 'Dutch translation missing');

const files = [
  'components/MuseumCard.js',
  'components/ExpositionCard.js',
  'pages/museum/[slug].js',
];
const tooltipPattern = /title={t\('affiliateLink'\)}/;
const notePattern = /className="affiliate-note"/;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  assert(tooltipPattern.test(content), `Tooltip missing in ${file}`);
  assert(notePattern.test(content), `Affiliate note missing in ${file}`);
}

console.log('Affiliate link tooltip and note tests passed.');
