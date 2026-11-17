// Step 1 — fetch the page (Cheerio parses it later).
const { USE_MOCKS } = require('../mocks');
const mockCrawl = require('../mocks/crawl.mock');
const { fetchText } = require('../lib/http');

async function crawlUrl(url) {
  const res = await fetchText(url);
  if (res.ok) return { ...res, mocked: false };
  if (USE_MOCKS) {
    // Demo domains don't resolve — use bundled HTML so the real analysers still run.
    return { ok: true, mocked: true, status: 200, ms: 640, text: mockCrawl.html, finalUrl: url, headers: {} };
  }
  throw new Error(`Crawl failed for ${url}: ${res.error || 'HTTP ' + res.status}`);
}
module.exports = { crawlUrl };