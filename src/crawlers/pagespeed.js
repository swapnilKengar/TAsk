// Step 2 — Google PageSpeed Insights (MOCKED by default)
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/pagespeed.mock');

const AUDITS = ['largest-contentful-paint', 'cumulative-layout-shift', 'interaction-to-next-paint', 'render-blocking-resources', 'unused-javascript'];

async function getPageSpeed(url) {
    if (USE_MOCKS) return mockData;

  const qs = new URLSearchParams({ url, strategy: 'mobile' });
  ['performance', 'seo', 'accessibility'].forEach((c) => qs.append('category', c));
  if (process.env.PAGESPEED_API_KEY) qs.set('key', process.env.PAGESPEED_API_KEY);
  const res = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${qs}`);
  if (!res.ok) throw new Error(`PageSpeed API ${res.status}`);
  const j = (await res.json()).lighthouseResult;

  const audits = {};
  AUDITS.forEach((id) => {
    const a = j.audits[id];
    if (a) audits[id] = { score: a.score, displayValue: a.displayValue, description: a.title };
  });
  return {
    url, strategy: 'mobile',
    categories: Object.fromEntries(Object.entries(j.categories).map(([k, v]) => [k, { score: v.score }])),
    audits,
  };
}
module.exports = { getPageSpeed };