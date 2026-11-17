// Step 6 — robots.txt + sitemap.xml + basic technical signals.
const { fetchText } = require('../lib/http');
const mockCrawl = require('../mocks/crawl.mock');

function parseRobots(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean);
  const sitemaps = [];
  let agents = [], disallowAll = false, disallowCount = 0, inGroupRules = false;
  for (const line of lines) {
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase(), val = m[2].trim();
    if (key === 'sitemap') sitemaps.push(val);
    else if (key === 'user-agent') { if (inGroupRules) { agents = []; inGroupRules = false; } agents.push(val); }
    else if (key === 'disallow') {
      inGroupRules = true;
      if (val) disallowCount++;
      if (val === '/' && agents.includes('*')) disallowAll = true;
    }
  }
  return { sitemaps, disallowAll, disallowCount };
}

async function checkTechnical(url, crawl) {
  const u = new URL(url);
  const origin = u.origin;
  let robotsText = null, robotsStatus = 0, sitemapText = null, sitemapUrl = null;

  if (crawl.mocked) {
    robotsText = mockCrawl.robotsTxt;
    robotsStatus = robotsText ? 200 : 404;
    sitemapText = mockCrawl.sitemapXml;
    sitemapUrl = `${origin}/sitemap.xml`;
  } else {
    const r = await fetchText(`${origin}/robots.txt`);
    robotsStatus = r.status;
    robotsText = r.ok ? r.text : null;
  }

  const robots = robotsText ? parseRobots(robotsText) : { sitemaps: [], disallowAll: false, disallowCount: 0 };

  if (!crawl.mocked) {
    const candidates = robots.sitemaps.length ? robots.sitemaps : [`${origin}/sitemap.xml`];
    for (const c of candidates) {
      const s = await fetchText(c);
      sitemapUrl = c;
      if (s.ok && /<(urlset|sitemapindex)/i.test(s.text)) { sitemapText = s.text; break; }
    }
  }

  return {
    https: u.protocol === 'https:',
    statusCode: crawl.status,
    responseTimeMs: crawl.ms,
    htmlSizeKb: Math.round(Buffer.byteLength(crawl.text || '') / 1024),
    redirected: !!crawl.finalUrl && crawl.finalUrl.replace(/\/$/, '') !== url.replace(/\/$/, ''),
    xRobotsTag: crawl.headers?.['x-robots-tag'] || null,
    robotsTxt: { exists: !!robotsText, status: robotsStatus, disallowAll: robots.disallowAll, disallowRules: robots.disallowCount, sitemapDirectives: robots.sitemaps },
    sitemap: {
      exists: !!sitemapText, url: sitemapUrl,
      isIndex: sitemapText ? /<sitemapindex/i.test(sitemapText) : false,
      urlCount: sitemapText ? (sitemapText.match(/<loc>/gi) || []).length : 0,
    },
    mocked: !!crawl.mocked,
  };
}
module.exports = { checkTechnical };