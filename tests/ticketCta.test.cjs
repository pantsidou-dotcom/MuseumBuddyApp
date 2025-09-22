const fs = require('fs');
const assert = require('assert');

const translationsContent = fs.readFileSync('lib/translations.js', 'utf8');
assert(/buyTickets:\s*'Buy tickets'/.test(translationsContent), 'English CTA translation missing');
assert(/buyTickets:\s*'Koop tickets'/.test(translationsContent), 'Dutch CTA translation missing');
assert(/ticketsViaOfficialSite:\s*'Opens official website'/.test(translationsContent), 'English official-site label missing');
assert(/ticketsViaOfficialSite:\s*'Opent officiële website'/.test(translationsContent), 'Dutch official-site label missing');
assert(/ticketsViaPartner:\s*'Opens partner website'/.test(translationsContent), 'English partner label missing');
assert(/ticketsViaPartner:\s*'Opent partnerwebsite'/.test(translationsContent), 'Dutch partner label missing');

const files = [
  'components/MuseumCard.js',
  'components/ExpositionCard.js',
  'pages/museum/[slug].js',
];
const legacyTooltipPattern = /title={t\('affiliateLink'\)}/;
const legacyNotePattern = /className="affiliate-note"/;
const newNotePattern = /TicketButtonNote/;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  assert(!legacyTooltipPattern.test(content), `Legacy affiliate tooltip found in ${file}`);
  assert(!legacyNotePattern.test(content), `Legacy affiliate note class found in ${file}`);
  assert(newNotePattern.test(content), `Ticket note missing in ${file}`);
}

console.log('Ticket CTA copy tests passed.');
