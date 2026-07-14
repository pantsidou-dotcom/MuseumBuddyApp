import fs from 'node:fs/promises';
import path from 'node:path';

const SITE = 'https://www.museumbuddy.nl';
const root = process.cwd();
const outDir = path.join(root, 'out');
const publicDir = path.join(root, 'public');
const coreRoutes = ['/', '/museum/rijksmuseum-amsterdam', '/museumgids/kindvriendelijke-musea-amsterdam', '/tentoonstellingen'];
const legacyRedirects = new Map([
  ['/?lang=en', '/'],
  ['/?lang=nl', '/'],
  ['/museum/rijksmuseum-amsterdam?lang=en', '/museum/rijksmuseum-amsterdam'],
  ['/museum/rijksmuseum-amsterdam?lang=nl', '/museum/rijksmuseum-amsterdam'],
  ['/kindvriendelijke-musea-amsterdam', '/museumgids/kindvriendelijke-musea-amsterdam'],
  ['/kindvriendelijke-musea-amsterdam?lang=nl', '/museumgids/kindvriendelijke-musea-amsterdam'],
  ['/kindvriendelijke-musea-amsterdam?lang=en', '/museumgids/kindvriendelijke-musea-amsterdam'],
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function htmlPath(route) {
  if (route === '/') return path.join(outDir, 'index.html');
  const withoutSlash = route.replace(/^\//, '');
  const htmlFile = path.join(outDir, `${withoutSlash}.html`);
  try {
    await fs.access(htmlFile);
    return htmlFile;
  } catch (error) {
    return path.join(outDir, withoutSlash, 'index.html');
  }
}

async function readRouteHtml(route) {
  return fs.readFile(await htmlPath(route), 'utf8');
}

function attr(html, regex) {
  return html.match(regex)?.[1] || '';
}

function visibleH1Count(html) {
  return [...html.matchAll(/<h1\b([^>]*)>/gi)].filter((match) => !/aria-hidden=["']true["']|hidden/i.test(match[1])).length;
}

function checkHtml(route, html) {
  const canonicals = [...html.matchAll(/<link\s+[^>]*rel=["']canonical["'][^>]*>/gi)];
  assert(canonicals.length === 1, `${route}: expected exactly one canonical, found ${canonicals.length}`);
  const canonical = attr(canonicals[0][0], /href=["']([^"']+)["']/i);
  assert(canonical.startsWith(SITE), `${route}: canonical does not use www host: ${canonical}`);
  assert(!canonical.includes('?'), `${route}: canonical contains query parameters: ${canonical}`);
  assert(canonical === `${SITE}${route === '/' ? '/' : route}`, `${route}: canonical is not self-referencing: ${canonical}`);
  assert(visibleH1Count(html) === 1, `${route}: expected one visible h1`);
  assert(/<title[^>]*>[^<]+<\/title>/i.test(html), `${route}: missing title`);
  assert(/<meta\s+[^>]*name=["']description["'][^>]*content=["'][^"']+/.test(html), `${route}: missing meta description`);

  for (const match of html.matchAll(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    JSON.parse(match[1]);
  }
}

async function checkStaticOutput() {
  for (const route of coreRoutes) {
    const html = await readRouteHtml(route);
    checkHtml(route, html);
  }
}

async function checkSeoFiles() {
  const sitemap = await fs.readFile(path.join(publicDir, 'sitemap.xml'), 'utf8');
  assert(!sitemap.includes('https://museumbuddy.nl'), 'sitemap contains non-www URL');
  assert(!sitemap.includes('?lang='), 'sitemap contains lang URL');
  assert(!/<loc>[^<]*\?[^<]*<\/loc>/.test(sitemap), 'sitemap contains query URL');
  assert(sitemap.includes(`${SITE}/museumgids/kindvriendelijke-musea-amsterdam`), 'sitemap missing family guide');
  assert(sitemap.includes(`${SITE}/tentoonstellingen`), 'sitemap missing exhibitions hub');

  const robots = await fs.readFile(path.join(publicDir, 'robots.txt'), 'utf8');
  assert(robots.includes(`Sitemap: ${SITE}/sitemap.xml`), 'robots.txt points to wrong sitemap');
}

async function checkVercelRedirects() {
  const config = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
  const redirects = config.redirects || [];
  assert(redirects.some((r) => r.has?.some((h) => h.type === 'host' && h.value === 'museumbuddy.nl') && r.destination === `${SITE}/:path*` && r.permanent), 'missing non-www to www permanent redirect');
  assert(redirects.some((r) => r.has?.some((h) => h.type === 'query' && h.key === 'lang') && r.destination === '/:path*' && r.permanent), 'missing lang stripping permanent redirect');
  for (const [oldPath, newPath] of legacyRedirects) {
    const bareOldPath = oldPath.split('?')[0];
    if (bareOldPath === '/' || oldPath.includes('lang=')) continue;
    assert(redirects.some((r) => r.source === bareOldPath && r.destination === newPath && r.permanent), `missing redirect ${oldPath} -> ${newPath}`);
  }
}

await checkStaticOutput();
await checkSeoFiles();
await checkVercelRedirects();
console.log('SEO checks passed');
