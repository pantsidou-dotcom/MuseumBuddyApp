import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStaticMuseums } from '../lib/staticMuseums.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

const STATIC_ROUTES = [
  '/',
  '/about',
  '/privacy',
  '/disclaimer',
  '/tentoonstellingen',
  '/gratis-musea-amsterdam',
  '/kindvriendelijke-musea-amsterdam',
  '/moderne-kunst-musea-amsterdam',
  '/musea-amsterdam-centrum',
  '/musea-amsterdam-vandaag-open',
  '/fotografie-musea-amsterdam',
  '/geschiedenis-musea-amsterdam',
  '/museumgidsen-amsterdam',
  '/ons-lieve-heer-op-solder-tickets',
];
const DEFAULT_SITE_URL = 'https://museumbuddy.nl';
const ROUTE_SOURCE_FILES = {
  '/': ['pages/index.js', 'lib/staticMuseums.js'],
  '/about': ['pages/about.js'],
  '/privacy': ['pages/privacy.js'],
  '/disclaimer': ['pages/disclaimer.js'],
  '/tentoonstellingen': ['pages/tentoonstellingen.js', 'lib/staticExhibitions.js'],
  '/gratis-musea-amsterdam': ['pages/gratis-musea-amsterdam.js', 'lib/staticMuseums.js'],
  '/kindvriendelijke-musea-amsterdam': [
    'pages/kindvriendelijke-musea-amsterdam.js',
    'lib/staticMuseums.js',
    'lib/kidFriendlyMuseums.js',
  ],
  '/moderne-kunst-musea-amsterdam': ['pages/moderne-kunst-musea-amsterdam.js', 'lib/seoLandingPages.js', 'lib/museumCategories.js'],
  '/musea-amsterdam-centrum': ['pages/musea-amsterdam-centrum.js', 'lib/seoLandingPages.js', 'lib/staticMuseums.js'],
  '/musea-amsterdam-vandaag-open': ['pages/musea-amsterdam-vandaag-open.js', 'lib/seoLandingPages.js', 'lib/museumOpeningHours.js'],
  '/fotografie-musea-amsterdam': ['pages/fotografie-musea-amsterdam.js', 'lib/seoLandingPages.js', 'lib/museumCategories.js'],
  '/geschiedenis-musea-amsterdam': ['pages/geschiedenis-musea-amsterdam.js', 'lib/seoLandingPages.js', 'lib/museumCategories.js'],
  '/museumgidsen-amsterdam': ['pages/museumgidsen-amsterdam.js'],
  '/ons-lieve-heer-op-solder-tickets': [
    'pages/ons-lieve-heer-op-solder-tickets.js',
    'components/TicketLandingTemplate.js',
  ],
};
const MUSEUM_SOURCE_FILES = ['pages/museum/[slug].js', 'lib/staticMuseums.js', 'lib/museumSummaries.js'];

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

async function getMostRecentMtimeIso(relativeFilePaths, fallbackIsoDate) {
  const stats = await Promise.all(
    relativeFilePaths.map(async (relativePath) => {
      const filePath = path.join(projectRoot, relativePath);
      try {
        return await fs.stat(filePath);
      } catch (error) {
        return null;
      }
    })
  );

  const latestMtimeMs = stats.reduce((latest, stat) => {
    if (!stat?.mtimeMs) return latest;
    return Math.max(latest, stat.mtimeMs);
  }, 0);

  if (!latestMtimeMs) {
    return fallbackIsoDate;
  }

  return new Date(latestMtimeMs).toISOString();
}

async function createSitemapXml(siteUrl) {
  const museumRoutes = getStaticMuseums()
    .map((museum) => museum?.slug)
    .filter(Boolean)
    .map((slug) => `/museum/${slug}`);

  const nowIsoDate = new Date().toISOString();
  const routeLastmodEntries = await Promise.all(
    STATIC_ROUTES.map(async (route) => {
      const sourceFiles = ROUTE_SOURCE_FILES[route] || [];
      const lastmod = await getMostRecentMtimeIso(sourceFiles, nowIsoDate);
      return [route, lastmod];
    })
  );
  const museumLastmod = await getMostRecentMtimeIso(MUSEUM_SOURCE_FILES, nowIsoDate);
  const lastmodByRoute = new Map(routeLastmodEntries);

  const urls = [...STATIC_ROUTES, ...museumRoutes]
    .map((route) => {
      const loc = xmlEscape(toAbsoluteUrl(siteUrl, route));
      const lastmod = lastmodByRoute.get(route) || museumLastmod;
      return `<url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`;
}

function createRobotsTxt(siteUrl) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
}

async function run() {
  const siteUrl = getSiteUrl();
  const sitemapXml = await createSitemapXml(siteUrl);
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
