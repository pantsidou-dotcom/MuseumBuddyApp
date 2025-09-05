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

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

// --- UTILS ---
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const nowIso = () => new Date().toISOString();

function normalizeText(s) {
  return (s || '')
    .replace(/\s+/g, ' ')
    .replace(/\u00A0/g, ' ')
    .trim();
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

async function existingTitlesForMuseum(museumId) {
  const { data, error } = await supabase
    .from('exposities')
    .select('titel')
    .eq('museum_id', museumId);
  if (error) return new Set();
  return new Set((data || []).map((r) => (r.titel || '').toLowerCase()));
}

async function insertExpositions(rows) {
  if (!rows.length) return { inserted: 0 };
  const { error } = await supabase.from('exposities').insert(rows);
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

  const existing = await existingTitlesForMuseum(museum.id);

  const rows = [];
  let skippedDup = 0;

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

    rows.push({
      museum_id: museum.id,
      titel,
      bron_url,
      is_tijdelijk: true,
      last_crawled_at: nowIso()
    });
  });

  let inserted = 0;
  if (rows.length) {
    const resInsert = await insertExpositions(rows);
    inserted = resInsert.inserted || 0;
  }

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
    if (s.ok) {
      console.log(`✅ ${s.slug} → found: ${s.found}, inserted: ${s.inserted}${typeof s.skippedDup === 'number' ? `, skippedDup: ${s.skippedDup}` : ''}`);
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
