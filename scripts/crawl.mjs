// scripts/crawl.mjs
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- ENV ---
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const SUPABASE_AUTH_OPTIONS = {
  persistSession: false,
  autoRefreshToken: false
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { ...SUPABASE_AUTH_OPTIONS },
  db: { schema: 'public' }
});

const SUPABASE_SCHEMA_CLIENTS = new Map([
  ['public', supabase]
]);

const DEFAULT_CRAWL_INTERVAL_DAYS = 30;
const parsedInterval = parseInt(process.env.CRAWLER_INTERVAL_DAYS || '', 10);
const CRAWLER_INTERVAL_DAYS = Number.isFinite(parsedInterval) && parsedInterval > 0 ? parsedInterval : DEFAULT_CRAWL_INTERVAL_DAYS;
const CRAWLER_INTERVAL_MS = CRAWLER_INTERVAL_DAYS * 24 * 60 * 60 * 1000;

const CRAWLER_META_TABLE = process.env.CRAWLER_META_TABLE || 'Crawler_Table';
const CRAWLER_META_CONFLICT_KEY = process.env.CRAWLER_META_CONFLICT_KEY || 'slug';
const CRAWLER_ITEMS_TABLE = process.env.CRAWLER_ITEMS_TABLE || 'tempcrawl.crawler.items';

const OPTIONAL_FIELD_DISABLE_VALUES = new Set(['', 'false', '0', 'null']);

const resolveRequiredFieldName = (value, fallback) => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed) return trimmed;
  }
  return fallback;
};

const resolveOptionalFieldName = (value, fallback = null) => {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (OPTIONAL_FIELD_DISABLE_VALUES.has(trimmed.toLowerCase())) return null;
    return trimmed;
  }
  return value;
};

const CRAWLER_META_LAST_CRAWLED_FIELD = resolveRequiredFieldName(
  process.env.CRAWLER_META_LAST_CRAWLED_FIELD,
  'last_crawled_at'
);

const ITEM_FIELD_MAP = {
  museumId: resolveRequiredFieldName(process.env.CRAWLER_ITEMS_MUSEUM_ID_FIELD, 'museum_id'),
  title: resolveRequiredFieldName(process.env.CRAWLER_ITEMS_TITLE_FIELD, 'titel'),
  url: resolveRequiredFieldName(process.env.CRAWLER_ITEMS_URL_FIELD, 'bron_url'),
  isTemporary: resolveOptionalFieldName(process.env.CRAWLER_ITEMS_IS_TEMP_FIELD, 'is_tijdelijk'),
  crawledAt: resolveRequiredFieldName(process.env.CRAWLER_ITEMS_LAST_CRAWLED_FIELD, 'last_crawled_at'),
  slug: resolveOptionalFieldName(process.env.CRAWLER_ITEMS_SLUG_FIELD)
};

function getSupabaseClientForSchema(schema) {
  const key = schema && schema.trim() ? schema.trim() : 'public';
  const existing = SUPABASE_SCHEMA_CLIENTS.get(key);
  if (existing) return existing;
  const client = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { ...SUPABASE_AUTH_OPTIONS },
    db: { schema: key }
  });
  SUPABASE_SCHEMA_CLIENTS.set(key, client);
  return client;
}

function parseTableIdentifier(rawValue, label) {
  const value = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!value) {
    throw new Error(`${label} heeft een lege of ontbrekende tabelnaam.`);
  }
  const segments = value.split('.').filter(Boolean);
  if (!segments.length) {
    throw new Error(`${label} bevat een ongeldige tabelnaam: ${rawValue}`);
  }
  if (segments.length === 1) {
    return { raw: value, schema: null, name: segments[0] };
  }
  const [schema, ...rest] = segments;
  return { raw: value, schema, name: rest.join('.') };
}

function parseTableOrExit(rawValue, label) {
  try {
    return parseTableIdentifier(rawValue, label);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(1);
  }
}

const META_TABLE = parseTableOrExit(CRAWLER_META_TABLE, 'CRAWLER_META_TABLE');
const ITEMS_TABLE = parseTableOrExit(CRAWLER_ITEMS_TABLE, 'CRAWLER_ITEMS_TABLE');

function fromTable(def) {
  return getSupabaseClientForSchema(def.schema).from(def.name);
}

const fromMetaTable = () => fromTable(META_TABLE);
const fromItemsTable = () => fromTable(ITEMS_TABLE);

function describeTable(def) {
  return `${def.raw} (schema: ${def.schema || 'public'})`;
}

console.log(`ℹ️  Gebruik crawler meta table: ${describeTable(META_TABLE)}`);
console.log(`ℹ️  Gebruik crawler items table: ${describeTable(ITEMS_TABLE)}`);

// --- UTILS ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();

function normalizeText(s) {
  return (s || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getCrawlerState(slug) {
  try {
    const selectColumns = ['slug', CRAWLER_META_LAST_CRAWLED_FIELD].filter(Boolean).join(',');
    const { data, error } = await fromMetaTable()
      .select(selectColumns)
      .eq('slug', slug)
      .maybeSingle();
    if (error) {
      console.warn(`⚠️  Kon crawler status niet ophalen voor ${slug}: ${error.message}`);
      return null;
    }
    return data;
  } catch (err) {
    console.warn(`⚠️  Kon crawler status niet ophalen voor ${slug}: ${err.message}`);
    return null;
  }
}

async function updateCrawlerState(slug, fields = {}) {
  try {
    const payload = { slug, ...fields };
    const { error } = await fromMetaTable()
      .upsert(payload, { onConflict: CRAWLER_META_CONFLICT_KEY });
    if (error) {
      console.warn(`⚠️  Kon crawler status niet bijwerken voor ${slug}: ${error.message}`);
    }
  } catch (err) {
    console.warn(`⚠️  Kon crawler status niet bijwerken voor ${slug}: ${err.message}`);
  }
}

function shouldSkipCrawl(meta) {
  const lastValue = meta ? meta[CRAWLER_META_LAST_CRAWLED_FIELD] : null;
  const last = parseDate(lastValue);
  if (!last) {
    return { skip: false, lastCrawledAt: null, msSinceLast: null };
  }
  const msSinceLast = Date.now() - last.getTime();
  if (msSinceLast < CRAWLER_INTERVAL_MS) {
    return { skip: true, lastCrawledAt: last, msSinceLast };
  }
  return { skip: false, lastCrawledAt: last, msSinceLast };
}

async function getMuseumBySlug(slug) {
  const { data, error } = await supabase
    .from('musea')
    .select('id, naam, slug')
    .eq('slug', slug)
    .single();
  if (error || !data) throw new Error(`Museum niet gevonden voor slug: ${slug}`);
  return data;
}

async function existingTitlesForMuseum(museumId, slug) {
  try {
    let query = fromItemsTable().select(ITEM_FIELD_MAP.title);
    if (ITEM_FIELD_MAP.museumId) {
      query = query.eq(ITEM_FIELD_MAP.museumId, museumId);
    }
    if (ITEM_FIELD_MAP.slug && slug) {
      query = query.eq(ITEM_FIELD_MAP.slug, slug);
    }
    const { data, error } = await query;
    if (error) {
      console.warn(`⚠️  Kon bestaande titels niet ophalen voor museum ${museumId}: ${error.message}`);
      return new Set();
    }
    const titleKey = ITEM_FIELD_MAP.title;
    const existing = new Set();
    for (const row of data || []) {
      const value = row?.[titleKey];
      if (value === undefined || value === null) continue;
      const normalized = String(value).trim().toLowerCase();
      if (normalized) existing.add(normalized);
    }
    return existing;
  } catch (err) {
    console.warn(`⚠️  Kon bestaande titels niet ophalen voor museum ${museumId}: ${err.message}`);
    return new Set();
  }
}

async function insertCrawlerItems(rows) {
  if (!rows.length) return { inserted: 0 };
  const { error } = await fromItemsTable().insert(rows);
  if (error) throw error;
  return { inserted: rows.length };
}

// ---------- URL CANDIDATES & FETCHING ----------

// Bouw veelvoorkomende paden (NL/EN) voor sites waar je alleen een domein geeft
function buildCommonPaths() {
  return [
    '/nl/tentoonstellingen/',
    '/nl/zien-en-doen/tentoonstellingen/',
    '/nl/agenda/',
    '/en/whats-on/exhibitions/',
    '/en/whats-on/',
    '/exhibitions/',
    '/exhibitions',
    '/tentoonstellingen/',
    '/tentoonstellingen',
    '/agenda/'
  ];
}

function ensureVariants(u) {
  // voeg variant zonder / of met / toe
  const out = new Set([u]);
  if (u.endsWith('/')) out.add(u.slice(0, -1));
  else out.add(u + '/');
  return [...out];
}

function isDomainOnly(u) {
  try {
    const url = new URL(u);
    return url.pathname === '/' || url.pathname === '';
  } catch {
    return false;
  }
}

function expandCandidates(urlOrArray) {
  if (Array.isArray(urlOrArray)) {
    // Voor arrays: voor elk item ook trailing-slash varianten
    return urlOrArray.flatMap(ensureVariants);
  }
  const base = urlOrArray;
  // Als je alleen een domein gaf → plak common paths eraan
  if (isDomainOnly(base)) {
    const { origin } = new URL(base);
    const paths = buildCommonPaths();
    return paths.flatMap((p) => ensureVariants(origin + p));
  }
  // Anders: gebruik de gegeven url + varianten
  return ensureVariants(base);
}

async function fetchFirstOk(urls, retries = 1) {
  const list = expandCandidates(urls);
  let lastError = null;

  for (const u of list) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await axios.get(u, {
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; MuseumBuddyBot/0.1; +https://example.com/bot)',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
            'Referer': 'https://www.google.com/'
          },
          validateStatus: (s) => s >= 200 && s < 400
        });
        console.log(`ℹ️  GET ${u} → status ${res.status}`);
        return { ok: true, url: u, html: res.data };
      } catch (e) {
        lastError = e;
        const code = e?.response?.status || e.code || e.message;
        console.warn(`⚠️  GET ${u} (attempt ${attempt + 1}) failed: ${code}`);
        // Bij 403/405 heeft nog een poging vaak geen zin; ga door naar volgende URL
        if (e?.response?.status === 403 || e?.response?.status === 405) break;
        // kleine backoff
        await sleep(800);
      }
    }
  }
  return { ok: false, error: lastError?.message || 'all candidates failed' };
}

// ---------- CRAWL ----------
async function crawlTarget(target) {
  const { slug, item } = target;
  let urlCandidates = target.urls || target.url;
  if (!slug || !urlCandidates || !item) {
    console.warn('⚠️ Ongeldig target, overslaan:', target);
    return { slug, found: 0, inserted: 0, skippedDup: 0, ok: false };
  }

  // Zorg dat we altijd met een array van URL-kandidaten werken
  if (!Array.isArray(urlCandidates)) {
    urlCandidates = [urlCandidates];
  }

  const meta = await getCrawlerState(slug);
  const skipInfo = shouldSkipCrawl(meta);
  if (skipInfo.skip) {
    const remainingMs = CRAWLER_INTERVAL_MS - (skipInfo.msSinceLast || 0);
    const remainingDays = remainingMs > 0 ? Math.ceil(remainingMs / (24 * 60 * 60 * 1000)) : 0;
    console.log(
      `⏭️  Skip ${slug}: laatst gecrawld op ${skipInfo.lastCrawledAt.toISOString()} (nog ~${remainingDays} dag(en) wachten)`
    );
    return {
      slug,
      found: 0,
      inserted: 0,
      skippedDup: 0,
      ok: true,
      skipped: true,
      reason: 'recently_crawled',
      lastCrawledAt: skipInfo.lastCrawledAt.toISOString()
    };
  }

  const museum = await getMuseumBySlug(slug);

  // HTML ophalen (probeer meerdere URL-kandidaten + varianten)
  const fetched = await fetchFirstOk(urlCandidates, 1);
  if (!fetched.ok) {
    throw new Error(fetched.error || 'no working URL');
  }
  const $ = cheerio.load(fetched.html);

  // Hoeveel items per target?
  const maxItems = typeof target.maxItems === 'number' ? target.maxItems : 12;

  // Probeer eerst de opgegeven selector
  let nodes = $(item).slice(0, maxItems);

  // Fallback als 0 matches
  if (nodes.length === 0) {
    console.warn(`⚠️  Selector matched 0 nodes for ${slug}. Tried: ${item}`);
    nodes = $('main a, .content a, article a, li a')
      .filter((_, el) => {
        const t = $(el).text().trim();
        return t.length > 3 && /tentoon|exhib|expo|present|te zien|exhibition|exhibitions|expositie/i.test(t);
      })
      .slice(0, maxItems);
  }

  const existing = await existingTitlesForMuseum(museum.id, slug);

  const rows = [];
  let skippedDup = 0;

  const crawlTimestamp = nowIso();

  nodes.each((_, el) => {
    const context = $(el);

    // Probeer een zinnige titel te vinden
    const titleCand =
      context.find('h1, h2, h3, .title, .card-title, .teaser__title, a').first().text() ||
      context.attr('title') ||
      context.text();

    let hrefCand =
      context.find('a[href]').first().attr('href') ||
      $(el).attr('href');

    const titel = normalizeText(titleCand).slice(0, 200);
    if (!titel) return;

    if (hrefCand && hrefCand.startsWith('/')) {
      try {
        const base = new URL(fetched.url);
        hrefCand = base.origin + hrefCand;
      } catch {
        // ignore
      }
    }
    const bron_url = hrefCand || fetched.url;

    // Dedup op titel per museum
    if (existing.has(titel.toLowerCase())) {
      skippedDup++;
      return;
    }

    const row = {
      [ITEM_FIELD_MAP.museumId]: museum.id,
      [ITEM_FIELD_MAP.title]: titel,
      [ITEM_FIELD_MAP.url]: bron_url,
      [ITEM_FIELD_MAP.crawledAt]: crawlTimestamp
    };
    if (ITEM_FIELD_MAP.isTemporary) {
      row[ITEM_FIELD_MAP.isTemporary] = true;
    }
    if (ITEM_FIELD_MAP.slug) {
      row[ITEM_FIELD_MAP.slug] = slug;
    }
    rows.push(row);
  });

  let inserted = 0;
  if (rows.length) {
    const resInsert = await insertCrawlerItems(rows);
    inserted = resInsert.inserted || 0;
  }

  await updateCrawlerState(slug, { [CRAWLER_META_LAST_CRAWLED_FIELD]: crawlTimestamp });

  return { slug, found: nodes.length, inserted, skippedDup, ok: true };
}

async function main() {
  // targets.json inlezen via fs
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const targetsPath = path.join(__dirname, 'targets.json');

  let targets = [];
  try {
    const raw = fs.readFileSync(targetsPath, 'utf-8');
    targets = JSON.parse(raw);
  } catch (e) {
    console.error('❌ targets.json kon niet worden gelezen of geparsed:', e.message);
    process.exit(1);
  }

  const summary = [];
  for (const t of targets) {
    try {
      const res = await crawlTarget(t);
      summary.push(res);
      await sleep(800); // kleine pauze tussen sites
    } catch (err) {
      summary.push({ slug: t.slug, ok: false, error: err.message });
    }
  }

  console.log('--- CRAWL SUMMARY ---');
  for (const s of summary) {
    if (s.skipped) {
      console.log(`⏭️ ${s.slug} → overgeslagen (laatste crawl: ${s.lastCrawledAt || 'onbekend'})`);
    } else if (s.ok) {
      const dupPart = typeof s.skippedDup === 'number' ? `, skippedDup: ${s.skippedDup}` : '';
      console.log(`✅ ${s.slug} → found: ${s.found}, inserted: ${s.inserted}${dupPart}`);
    } else {
      console.log(`❌ ${s.slug} → ${s.error || 'unknown error'}`);
    }
  }

  const allFailed = summary.every((s) => !s.ok);
  process.exit(allFailed ? 1 : 0);
}

main().catch((e) => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});
