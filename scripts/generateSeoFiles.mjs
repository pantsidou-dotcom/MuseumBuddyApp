import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStaticMuseums } from '../lib/staticMuseums.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const STATIC_ROUTES = ['/', '/about', '/privacy', '/favorites', '/disclaimer', '/tentoonstellingen'];
const DEFAULT_SITE_URL = 'https://museumbuddy.nl';

function getSiteUrl() {
  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || DEFAULT_SITE_URL;
  return rawSiteUrl.replace(/\/+$/, '');
}

function xmlEscape(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toAbsoluteUrl(baseUrl, pathname) {
  const normalizedPath = pathname === '/' ? '' : pathname;
  return `${baseUrl}${normalizedPath}`;
}

function createSitemapXml(siteUrl) {
  const museumRoutes = getStaticMuseums()
    .map((museum) => museum?.slug)
    .filter(Boolean)
    .map((slug) => `/museum/${slug}`);

  const allRoutes = [...STATIC_ROUTES, ...museumRoutes];
  const nowIsoDate = new Date().toISOString();

  const urls = allRoutes
    .map((route) => {
      const loc = xmlEscape(toAbsoluteUrl(siteUrl, route));
      return `<url><loc>${loc}</loc><lastmod>${nowIsoDate}</lastmod></url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}

function createRobotsTxt(siteUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

async function run() {
  const siteUrl = getSiteUrl();
  const sitemapXml = createSitemapXml(siteUrl);
  const robotsTxt = createRobotsTxt(siteUrl);

  await fs.mkdir(publicDir, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf8'),
    fs.writeFile(path.join(publicDir, 'robots.txt'), robotsTxt, 'utf8'),
  ]);

  console.log(`Generated sitemap.xml and robots.txt for ${siteUrl}`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
