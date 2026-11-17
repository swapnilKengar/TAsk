// Client-safe (no Node deps): shared by the pipeline and the admin UI.
const STEPS = [
  { id: 'crawl', label: 'Crawl page (fetch + Cheerio)', progress: 10 },
  { id: 'pagespeed', label: 'PageSpeed Insights', progress: 25 },
  { id: 'gsc', label: 'Google Search Console', progress: 35 },
  { id: 'schema', label: 'Schema.org validation', progress: 45 },
  { id: 'onpage', label: 'On-page analysis', progress: 55 },
  { id: 'technical', label: 'robots.txt + sitemap.xml', progress: 65 },
  { id: 'rankings', label: 'DataForSEO rankings', progress: 75 },
  { id: 'claude', label: 'Claude analysis', progress: 88 },
  { id: 'store', label: 'Save audit to Postgres', progress: 92 },
  { id: 'pdf', label: 'Generate PDF report', progress: 96 },
  { id: 'notify', label: 'Send via WhatsApp + email', progress: 99 },
];
module.exports = { STEPS };