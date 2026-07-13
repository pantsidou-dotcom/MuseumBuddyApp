import { getStaticMuseums } from './staticMuseums.js';
import { getMuseumCategories } from './museumCategories.js';
import { isKidFriendly } from './kidFriendlyMuseums.js';
import { normalizeExhibitionDates } from './exhibitionStatus.js';

export const DISCOVERY_MIN_INDEXABLE_RESULTS = 3;
export const DISCOVERY_TIME_ZONE = 'Europe/Amsterdam';
const WEEKDAYS = ['sun','mon','tue','wed','thu','fri','sat'];
const MUSEUMPLEIN = { lat: 52.3579, lon: 4.8811 };
const LOW_PRICE_SLUGS = new Set(['woonbootmuseum-amsterdam','kattenkabinet-amsterdam','het-grachtenmuseum-amsterdam']);
const MUSEUMKAART_SLUGS = new Set(['rijksmuseum-amsterdam','stedelijk-museum-amsterdam','nemo-science-museum-amsterdam','scheepvaartmuseum-amsterdam','joods-museum-amsterdam','rembrandthuis-amsterdam','allard-pierson-amsterdam','museum-van-loon-amsterdam','huis-marseille-amsterdam','het-schip-amsterdam','wereldmuseum-amsterdam']);
const LESSER_KNOWN_SLUGS = new Set(['kattenkabinet-amsterdam','woonbootmuseum-amsterdam','het-grachtenmuseum-amsterdam','museum-van-loon-amsterdam','huis-marseille-amsterdam','het-schip-amsterdam','allard-pierson-amsterdam']);
const RAINY_CATEGORIES = new Set(['history','art','modern-art','photography','science']);

export function ymdInAmsterdam(now = new Date()) {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: DISCOVERY_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function dateInAmsterdam(ymd) { return new Date(`${ymd}T12:00:00+01:00`); }
export function addDaysYmd(ymd, days) { const d = dateInAmsterdam(ymd); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0,10); }
export function weekdayKey(ymd) { return WEEKDAYS[dateInAmsterdam(ymd).getUTCDay()]; }

function parseRange(text) {
  if (!text) return null;
  const match = String(text).match(/(\d{1,2})[:.](\d{2})\s*[–-]\s*(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  return { opens: `${match[1].padStart(2,'0')}:${match[2]}`, closes: `${match[3].padStart(2,'0')}:${match[4]}` };
}

function dayMatches(text, day) {
  const s = String(text || '').toLowerCase();
  if (s.includes('daily') || s.includes('dagelijks')) return true;
  const groups = { mon:['mon','ma'], tue:['tue','di'], wed:['wed','wo'], thu:['thu','do'], fri:['fri','vr'], sat:['sat','za'], sun:['sun','zo'] };
  return groups[day].some((token) => s.includes(token));
}

export function getOpeningForDate(museum, ymd) {
  const exceptions = museum.opening_exceptions || museum.openingExceptions || {};
  if (exceptions[ymd] === 'closed') return { status: 'closed', source: 'exception' };
  if (typeof exceptions[ymd] === 'string') return { status: 'open', ...parseRange(exceptions[ymd]), source: 'exception' };
  const source = museum.openingstijden || museum.opening_hours || museum.openingHours;
  const hours = source || museum.openingHoursText || null;
  const text = hours || null;
  if (!text || !dayMatches(text, weekdayKey(ymd))) return { status: 'unknown' };
  const range = parseRange(text);
  if (!range) return { status: 'unknown' };
  return { status: 'open', ...range, source: 'weekly' };
}

function isEveningOpen(museum, ymd) {
  const opening = getOpeningForDate(museum, ymd);
  return opening.status === 'open' && Number(opening.closes.slice(0,2)) >= 19;
}
function distanceMeters(a,b){ const R=6371000, toRad=(n)=>n*Math.PI/180; const dLat=toRad(b.lat-a.lat), dLon=toRad(b.lon-a.lon); const lat1=toRad(a.lat), lat2=toRad(b.lat); const h=Math.sin(dLat/2)**2+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(h)); }
function coords(m){ const lat=Number(m.latitude ?? m.lat); const lon=Number(m.longitude ?? m.lon ?? m.lng); return Number.isFinite(lat)&&Number.isFinite(lon)?{lat,lon}:null; }
function card(m){ return { ...m, image: m.afbeelding_url || m.image_url || null }; }

export const DISCOVERY_PAGE_CONFIGS = {
  'vandaag-open': { path:'/ontdek/vandaag-open', title:'Musea vandaag open in Amsterdam | MuseumBuddy', heading:'Vandaag open', intro:'Een actuele selectie musea die vandaag open zijn op basis van dagspecifieke openingstijden.', criteria:'Alleen musea met verifieerbare openingstijden voor deze datum worden getoond; onbekende tijden tellen niet mee.', faq:[['Waarom staat een museum niet in de lijst?','Omdat we zonder openingstijden voor vandaag niet claimen dat het museum open is.']] },
  'dit-weekend': { path:'/ontdek/dit-weekend', title:'Musea dit weekend in Amsterdam | MuseumBuddy', heading:'Dit weekend', intro:'Plan je weekend met musea die op zaterdag of zondag open zijn volgens actuele openingstijden.', criteria:'Selectie vereist openingstijddata voor komend weekend.' },
  'vanavond-open': { path:'/ontdek/vanavond-open', title:'Musea vanavond open in Amsterdam | MuseumBuddy', heading:'Vanavond open', intro:'Musea die vandaag tot in de avond open zijn, handig voor een bezoek na werk of diner.', criteria:'Alleen musea met sluitingstijd vanaf 19:00 voor vandaag.' },
  'met-kinderen': { path:'/ontdek/met-kinderen', title:'Musea met kinderen in Amsterdam | MuseumBuddy', heading:'Met kinderen', intro:'Kindvriendelijke musea met interactieve, verrassende of toegankelijke collecties.', criteria:'Gebaseerd op centrale kindvriendelijke signalen en gecontroleerde museumprofielen.' },
  'geschikt-bij-regen': { path:'/ontdek/geschikt-bij-regen', title:'Musea geschikt bij regen in Amsterdam | MuseumBuddy', heading:'Geschikt bij regen', intro:'Droge, overdekte museumkeuzes voor een regenachtige dag in Amsterdam.', criteria:'Binnenmusea met relevante categorieën zoals kunst, geschiedenis, fotografie of wetenschap.' },
  'tentoonstellingen-binnenkort-eindigen': { path:'/ontdek/tentoonstellingen-binnenkort-eindigen', title:'Tentoonstellingen die binnenkort eindigen | MuseumBuddy', heading:'Tentoonstellingen die binnenkort eindigen', intro:'Actuele tentoonstellingen waarvan de einddatum nadert.', criteria:'Alleen geverifieerde tentoonstellingen met einddatum binnen 45 dagen en niet verlopen.' },
  'museumplein': { path:'/ontdek/musea-bij-museumplein', title:'Musea in de buurt van Museumplein | MuseumBuddy', heading:'Musea in de buurt van Museumplein', intro:'Musea op of rond Museumplein, ideaal om meerdere bezoeken te combineren.', criteria:'Musea binnen circa 1,5 kilometer van Museumplein, wanneer coördinaten beschikbaar zijn.' },
  'gratis-of-lage-prijs': { path:'/ontdek/gratis-of-lage-prijs', title:'Gratis of voordelige musea in Amsterdam | MuseumBuddy', heading:'Gratis of lage prijs', intro:'Budgetvriendelijke museumkeuzes in Amsterdam.', criteria:'Gratis toegankelijke musea of centraal gemarkeerde lage-prijs opties.' },
  'museumkaart': { path:'/ontdek/museumkaart', title:'Musea met Museumkaart in Amsterdam | MuseumBuddy', heading:'Museumkaart', intro:'Musea waar de Museumkaart doorgaans relevant is voor je bezoekplanning.', criteria:'Centrale, herbruikbare lijst met Museumkaart-signaal; controleer voorwaarden bij het museum.' },
  'minder-bekende-musea': { path:'/ontdek/minder-bekende-musea', title:'Minder bekende musea in Amsterdam | MuseumBuddy', heading:'Minder bekende musea', intro:'Kleinere of minder voor de hand liggende musea voor bezoekers die verder willen kijken.', criteria:'Samengesteld uit musea buiten de grootste publiekstrekkers met voldoende profieldata.' },
};

export function selectDiscoveryResults(key, { museums = getStaticMuseums(), exhibitions = [], now = new Date() } = {}) {
  const today = ymdInAmsterdam(now);
  let results = [];
  if (key === 'vandaag-open') results = museums.filter((m)=>getOpeningForDate(m,today).status==='open');
  else if (key === 'dit-weekend') { const day = dateInAmsterdam(today).getUTCDay(); const sat = addDaysYmd(today, (6 - day + 7) % 7); const sun = addDaysYmd(sat,1); results = museums.filter((m)=>[sat,sun].some((d)=>getOpeningForDate(m,d).status==='open')); }
  else if (key === 'vanavond-open') results = museums.filter((m)=>isEveningOpen(m,today));
  else if (key === 'met-kinderen') results = museums.filter((m)=>isKidFriendly(m));
  else if (key === 'geschikt-bij-regen') results = museums.filter((m)=>getMuseumCategories(m.slug).some((c)=>RAINY_CATEGORIES.has(c)));
  else if (key === 'museumplein') results = museums.filter((m)=>{ const c=coords(m); return c ? distanceMeters(MUSEUMPLEIN,c)<=1500 : ['rijksmuseum-amsterdam','van-gogh-museum-amsterdam','stedelijk-museum-amsterdam','moco-museum-amsterdam'].includes(m.slug); });
  else if (key === 'gratis-of-lage-prijs') results = museums.filter((m)=>m.gratis_toegankelijk === true || LOW_PRICE_SLUGS.has(m.slug));
  else if (key === 'museumkaart') results = museums.filter((m)=>MUSEUMKAART_SLUGS.has(m.slug));
  else if (key === 'minder-bekende-musea') results = museums.filter((m)=>LESSER_KNOWN_SLUGS.has(m.slug));
  else if (key === 'tentoonstellingen-binnenkort-eindigen') results = exhibitions.map((e)=>({...e,...normalizeExhibitionDates(e,{ today })})).filter((e)=>e.date_status==='current' && e.end_date && e.end_date <= addDaysYmd(today,45));
  return results.map(card).sort((a,b)=>(a.naam || a.title || '').localeCompare(b.naam || b.title || '', 'nl'));
}

export function buildDiscoveryPage(key, opts) {
  const config = DISCOVERY_PAGE_CONFIGS[key];
  const results = selectDiscoveryResults(key, opts);
  const indexable = results.length >= DISCOVERY_MIN_INDEXABLE_RESULTS;
  return { config, results, indexable, robots: indexable ? undefined : 'noindex,follow', updatedAt: ymdInAmsterdam(opts?.now || new Date()), canonical: config?.path };
}
