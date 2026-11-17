// Step 7 — DataForSEO SERP rankings (MOCKED by default)
const { USE_MOCKS } = require('../mocks');
const mockData = require('../mocks/dataforseo.mock');

async function getRankings(client) {
  if (USE_MOCKS) return mockData;

  const { DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD } = process.env;
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) throw new Error('DataForSEO credentials not set. Use USE_MOCKS=true.');
  const keyword = `${client.businessType} ${client.city}`.toLowerCase();
  const res = await fetch('https://api.dataforseo.com/v3/serp/google/organic/live/regular', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([{ keyword, location_name: `${client.city},${client.state},India`, language_code: 'en' }]),
  });
  if (!res.ok) throw new Error(`DataForSEO ${res.status}`);
  const data = await res.json();
  const domain = new URL(client.websiteUrl).hostname.replace(/^www\./, '');
  const items = data.tasks?.[0]?.result?.[0]?.items || [];
  const mine = items.find((i) => i.type === 'organic' && (i.domain || '').replace(/^www\./, '') === domain);
  return { tasks: data.tasks, client_rank_position: mine ? mine.rank_absolute : null, keyword_search_volume: null };
}
module.exports = { getRankings };