// Step 10 — PDF report. Puppeteer (primary) → pdfkit (fallback). Saves to REPORTS_DIR (default <tmp>/reports).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pdfkitBuffer } = require('./pdf-kit');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const txt = (i) => (typeof i === 'string' ? i : i?.finding || i?.title || JSON.stringify(i));
const LABELS = { technical: 'Technical', on_page: 'On-page', content: 'Content', core_web_vitals: 'Core Web Vitals', schema: 'Schema' };

function reportHtml({ client, audit }) {
  const r = audit.result || {};
  const list = (a) => `<ul>${(a || []).map((i) => `<li>${esc(txt(i))}</li>`).join('')}</ul>`;
  const bars = Object.entries(audit.scoreBreakdown || r.score_breakdown || {}).map(([k, v]) =>
    `<div class="bar"><span>${LABELS[k] || k}</span><i><b style="width:${v}%"></b></i><em>${v}</em></div>`).join('');
  const recs = (r.recommendations || []).map((x) => `
    <div class="rec ${esc(x.priority)}"><h4>[${esc(x.priority)}] ${esc(x.category)} <small>impact ${esc(x.estimated_impact)} · effort ${esc(x.effort)}</small></h4>
    <p><b>Finding:</b> ${esc(x.finding)}</p><p><b>Fix:</b> ${esc(x.fix)}</p><p><b>How we will know:</b> ${esc(x.falsifiability_check)}</p></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:Helvetica,Arial,sans-serif;color:#12202B;margin:0;padding:32px;font-size:12px;line-height:1.5}
  h1{margin:0;font-size:24px} h2{color:#0E6B6F;font-size:15px;margin:22px 0 6px} .muted{color:#5B6B78}
  .score{font-size:44px;font-weight:700;color:#0E6B6F} .bar{display:flex;align-items:center;gap:8px;margin:4px 0}
  .bar span{width:120px}.bar i{flex:1;height:8px;background:#D5DCE2;border-radius:4px;overflow:hidden}.bar b{display:block;height:100%;background:#0E6B6F}.bar em{width:28px;font-style:normal}
  .rec{border-left:4px solid #5B6B78;padding:6px 12px;margin:10px 0;background:#F6F8F9;break-inside:avoid}
  .rec.CRITICAL{border-color:#B3261E}.rec.HIGH{border-color:#B85C0A}.rec.MEDIUM{border-color:#8A7200}.rec.LOW{border-color:#2F7A4B}
  .rec h4{margin:0 0 4px}.rec small{color:#5B6B78;font-weight:400}.rec p{margin:2px 0}
  </style></head><body>
  <h1>SEO Audit Report</h1><div class="muted">${esc(client.name)} — ${esc(client.websiteUrl)}<br>${esc(client.city)}, ${esc(client.state)} · ${new Date(audit.completedAt || audit.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</div>
  <div class="score">${audit.overallScore ?? r.overall_score ?? '—'}<span class="muted" style="font-size:18px"> / 100</span></div>
  <h2>Executive summary</h2><p>${esc(r.executive_summary)}</p>
  <h2>Score breakdown</h2>${bars}
  <h2>Critical issues</h2>${list(r.critical_issues)}
  <h2>Important issues</h2>${list(r.important_issues)}
  <h2>Quick wins (≤ 2 hours)</h2>${list(r.quick_wins)}
  <h2>Recommendations</h2>${recs}</body></html>`;
} 

async function puppeteerPdf(data, file) {
   const mod = await import(/* webpackIgnore: true */ 'puppeteer'); // optional dependency
  const puppeteer = mod.default || mod; // optional dependency
  const browser = await puppeteer.launch({ headless: 'true', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(reportHtml(data), { waitUntil: 'load' });
    await page.pdf({ path: file, format: 'A4', printBackground: true, margin: { top: '12mm', bottom: '12mm', left: '10mm', right: '10mm' } });
  } finally { await browser.close(); }
}

async function generatePdfFile(data) {
  const dir = process.env.REPORTS_DIR || path.join(os.tmpdir(), 'reports');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `seo-audit-${data.audit.id}.pdf`);

  if ((process.env.PDF_ENGINE || 'puppeteer') === 'puppeteer') {
    try { await puppeteerPdf(data, file); return { path: file, engine: 'puppeteer' }; }
    catch (e) { console.warn('[PDF] Puppeteer unavailable, falling back to pdfkit:', e.message); }
  }
  fs.writeFileSync(file, await pdfkitBuffer(data));
  return { path: file, engine: 'pdfkit' };
}
module.exports = { generatePdfFile, reportHtml };