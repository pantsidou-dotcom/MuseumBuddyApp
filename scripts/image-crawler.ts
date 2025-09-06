import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const [museumIdArg, museumUrl, attribution] = process.argv.slice(2);

if (!museumIdArg || !museumUrl) {
  console.error('Usage: ts-node scripts/image-crawler.ts <museum_id> <museum_url> [attribution]');
  process.exit(1);
}

const museumId = Number(museumIdArg);
if (Number.isNaN(museumId)) {
  console.error('museum_id must be a number');
  process.exit(1);
}

async function fetchHtml(url: string): Promise<string> {
  const res = await axios.get(url, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MuseumBuddyBot/1.0; +https://example.com/bot)',
      Accept: 'text/html,application/xhtml+xml',
    },
    validateStatus: (s) => s >= 200 && s < 400,
  });
  return res.data as string;
}

function resolveUrl(src: string, base: string): string {
  try {
    return new URL(src, base).href;
  } catch {
    return src;
  }
}

function extractJsonLdImage($: cheerio.CheerioAPI, base: string): string | null {
  const scripts = $('script[type="application/ld+json"]');
  for (const el of scripts.toArray()) {
    try {
      const json = JSON.parse($(el).contents().text());
      const img = (json.image && (Array.isArray(json.image) ? json.image[0] : json.image)) || null;
      if (typeof img === 'string') return resolveUrl(img, base);
      if (img && typeof img.url === 'string') return resolveUrl(img.url, base);
    } catch {
      // ignore JSON errors
    }
  }
  return null;
}

function largestImage($: cheerio.CheerioAPI, base: string): string | null {
  let bestUrl: string | null = null;
  let bestArea = 0;
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    if (!src) return;
    const w = parseInt($(el).attr('width') || '0', 10);
    const h = parseInt($(el).attr('height') || '0', 10);
    const area = w * h;
    if (!bestUrl || area > bestArea) {
      bestUrl = resolveUrl(src, base);
      bestArea = area;
    }
  });
  return bestUrl;
}

async function findImageUrl(html: string, pageUrl: string): Promise<string | null> {
  const $ = cheerio.load(html);
  const og = $('meta[property="og:image"]').attr('content');
  if (og) return resolveUrl(og, pageUrl);
  const tw = $('meta[name="twitter:image"]').attr('content');
  if (tw) return resolveUrl(tw, pageUrl);
  const ld = extractJsonLdImage($, pageUrl);
  if (ld) return ld;
  return largestImage($, pageUrl);
}

async function validateImage(url: string): Promise<boolean> {
  try {
    const res = await axios.head(url, { timeout: 15000 });
    const type = (res.headers['content-type'] || '') as string;
    return type.startsWith('image/');
  } catch {
    return false;
  }
}

async function main() {
  const html = await fetchHtml(museumUrl);
  const imageUrl = await findImageUrl(html, museumUrl);
  if (!imageUrl) throw new Error('No image found');
  const ok = await validateImage(imageUrl);
  if (!ok) throw new Error('URL is not an image');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Missing Supabase env vars');

  const supabase = createClient(supabaseUrl, serviceKey);

  const { error } = await supabase
    .from('musea')
    .update({
      image_url: imageUrl,
      image_source: museumUrl,
      attribution: attribution || null,
      image_updated_at: new Date().toISOString(),
    })
    .eq('id', museumId);

  if (error) throw error;
  console.log(`Stored image for museum ${museumId}: ${imageUrl}`);
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
