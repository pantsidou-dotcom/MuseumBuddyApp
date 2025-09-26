const fs = require('fs');
const assert = require('assert');

const translationsContent = fs.readFileSync('lib/translations.js', 'utf8');
assert(/buyTickets:\s*'Buy tickets'/.test(translationsContent), 'English CTA translation missing');
assert(/buyTickets:\s*'Koop tickets'/.test(translationsContent), 'Dutch CTA translation missing');
assert(/ticketsViaOfficialSite:\s*'Opens official website'/.test(translationsContent), 'English official-site label missing');
assert(/ticketsViaOfficialSite:\s*'Opent officiële website'/.test(translationsContent), 'Dutch official-site label missing');
assert(/ticketsViaPartner:\s*'Opens partner website'/.test(translationsContent), 'English partner label missing');
assert(/ticketsViaPartner:\s*'Opent partnerwebsite'/.test(translationsContent), 'Dutch partner label missing');
assert(
  /ticketsAffiliateHover:\s*'MuseumBuddy may receive a commission when you buy via this partner.'/.test(translationsContent),
  'English affiliate hover copy missing'
);
assert(
  /ticketsAffiliateHover:\s*'MuseumBuddy ontvangt mogelijk een commissie wanneer je via deze partner koopt.'/.test(
    translationsContent
  ),
  'Dutch affiliate hover copy missing'
);
assert(
  /ticketsAffiliateDisclosure:\s*'Partner link — MuseumBuddy may receive a commission when you buy via this link.'/.test(
    translationsContent
  ),
  'English affiliate disclosure copy missing'
);
assert(
  /ticketsAffiliateDisclosure:\s*'Partnerlink — MuseumBuddy ontvangt mogelijk commissie bij aankoop via deze link.'/.test(
    translationsContent
  ),
  'Dutch affiliate disclosure copy missing'
);
assert(/ticketsPartnerBadge:\s*'Partner'/.test(translationsContent), 'English partner badge copy missing');
assert(/ticketsPartnerBadge:\s*'Partner'/.test(translationsContent), 'Dutch partner badge copy missing');

const files = [
  'components/MuseumCard.js',
  'components/ExpositionCard.js',
  'pages/museum/[slug].js',
];
const legacyTooltipPattern = /title={t\('affiliateLink'\)}/;
const legacyNotePattern = /className="affiliate-note"/;
const newNotePattern = /TicketButtonNote/;
const hoverTitlePattern = /title={ticketHoverMessage}/;
const partnerBadgePattern = /ticketsPartnerBadge/;
const affiliateInfoPattern = /TicketButtonAffiliateInfo/;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  assert(!legacyTooltipPattern.test(content), `Legacy affiliate tooltip found in ${file}`);
  assert(!legacyNotePattern.test(content), `Legacy affiliate note class found in ${file}`);
  assert(newNotePattern.test(content), `Ticket note missing in ${file}`);
  assert(hoverTitlePattern.test(content), `Affiliate hover title missing in ${file}`);
  assert(partnerBadgePattern.test(content), `Partner badge translation missing in ${file}`);
  assert(!affiliateInfoPattern.test(content), `Legacy affiliate info component found in ${file}`);
}

console.log('Ticket CTA copy tests passed.');
