// scripts/crawl.mjs
import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Optioneel lokaal testen: laadt .env (in Actions NIET nodig)
// try { await import('dotenv/config'); } catch {}

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

// Helpers
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

async function crawlTarget(target) {
  const { slug, url, item } = target;
  if (!slug || !url || !item) {
    console.warn('⚠️ Ongeldig target, overslaan:', target);
    return { slug, url, found: 0, inserted: 0 };
    }
  const museum = await getMuseumBySlug(slug);

  // HTML ophalen
  const res = await axios.get(url, {
    timeout: 20000,
    headers: {
      'User-Agent': 'MuseumBuddyBot/0.1 (+contact: yourdomain.example)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    // geen redirects volgen naar pdf of zip, maar axios volgt standaard 5x
  });
  const $ = cheerio.load(res.data);

  // Items selecteren
  // was: const maxItems = 5;
  const maxItems = typeof target.maxItems === 'number' ? target.maxItems : 12;
  let nodes = $(item).slice(0, maxItems);
  if (nodes.length === 0) {
    console.warn(`⚠️  Selector matched 0 nodes for ${slug}. Tried: ${item}`);

    // brede fallback: betekenisvolle links binnen main/content
    nodes = $('main a, .content a, article a, li a')
      .filter((_, el) => {
        const t = $(el).text().trim();
        return t.length > 3 && /tentoon|exhib|expo|present|te zien|exhibition|exhibitions|expositie/i.test(t);
      })
      .slice(0, maxItems);
  }
  const existing = await existingTitlesForMuseum(museum.id);

  const rows = [];
  nodes.each((_, el) => {
    const context = $(el);

    // Slimme goks voor titel & link:
    const titleCand =
      context.find('h3, h2, .title, .card-title, .teaser__title, a').first().text() ||
      context.attr('title') ||
      context.text();

    const hrefCand =
      context.find('a[href]').first().attr('href') ||
      $(el).attr('href');

    const titel = normalizeText(titleCand).slice(0, 200); // houd het beperkt
    if (!titel) return;

    // Absolutiseer URL als nodig
    let bron_url = hrefCand || '';
    if (bron_url && bron_url.startsWith('/')) {
      try {
        const base = new URL(url);
        bron_url = base.origin + bron_url;
      } catch {}
    }

    // dubbele titels overslaan (simpele dedup)
    if (existing.has(titel.toLowerCase())) return;

    rows.push({
      museum_id: museum.id,
      titel,
      bron_url: bron_url || url,
      is_tijdelijk: true,
      last_crawled_at: nowIso(),
      // start/eind datum laten we leeg; geavanceerd parsen kan later
    });
  });

  let inserted = 0;
  if (rows.length) {
    const resInsert = await insertExpositions(rows);
    inserted = resInsert.inserted || 0;
  }

  return { slug, url, found: nodes.length, inserted };
}

async function main() {
  // targets.json inlezen (dynamic import zodat bundlers niet klagen)
  const targets = (await import('./targets.json', { assert: { type: 'json' } })).default;

  const summary = [];
  for (const t of targets) {
    try {
      const res = await crawlTarget(t);
      summary.push({ ...res, ok: true });
      // kleine pauze tussen sites
      await sleep(1000);
    } catch (err) {
      summary.push({ slug: t.slug, url: t.url, ok: false, error: err.message });
    }
  }

  // Console samenvatting
  console.log('--- CRAWL SUMMARY ---');
  for (const s of summary) {
    if (s.ok) {
      console.log(`✅ ${s.slug} → found: ${s.found}, inserted: ${s.inserted}`);
    } else {
      console.log(`❌ ${s.slug} → ${s.error}`);
    }
  }

  // Exit code 0 ook als sommige targets falen → we willen niet dat de hele Action stopt.
  const allFailed = summary.every((s) => !s.ok);
  process.exit(allFailed ? 1 : 0);
}

main().catch((e) => {
  console.error('❌ Fatal:', e);
  process.exit(1);
});
