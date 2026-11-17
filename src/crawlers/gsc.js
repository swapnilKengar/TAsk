// Step 3 — Google Search Console (MOCKED by default)
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/gsc.mock');

async function getSearchConsole(url) {
  if (USE_MOCKS) return mockData;

  // Real call needs an OAuth access token for a verified property.
  const token = process.env.GSC_ACCESS_TOKEN;
  if (!token) throw new Error('GSC_ACCESS_TOKEN not set (Search Console needs OAuth). Use USE_MOCKS=true.');
  const end = new Date(), start = new Date(Date.now() - 28 * 864e5);
  const fmt = (d) => d.toISOString().slice(0, 10);
  const res = await fetch(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(url)}/searchAnalytics/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ startDate: fmt(start), endDate: fmt(end), dimensions: ['query'], rowLimit: 25 }),
  });
  if (!res.ok) throw new Error(`GSC API ${res.status}`);
  const rows = (await res.json()).rows || [];
  return {
    rows: rows.map((r) => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position })),
    totalClicks: rows.reduce((s, r) => s + r.clicks, 0),
    totalImpressions: rows.reduce((s, r) => s + r.impressions, 0),
    indexCoverageErrors: null, // needs the URL Inspection API
  };
}
module.exports = { getSearchConsole };