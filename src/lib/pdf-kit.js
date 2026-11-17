// Pure-Node PDF renderer (pdfkit) — works on serverless and as the Puppeteer fallback.
const PDFDocument = require('pdfkit');

const LABELS = { technical: 'Technical', on_page: 'On-page', content: 'Content', core_web_vitals: 'Core Web Vitals', schema: 'Schema' };
const txt = (i) => (typeof i === 'string' ? i : i?.finding || i?.title || JSON.stringify(i));

function pdfkitBuffer({ client, audit }) {
  return new Promise((resolve, reject) => {
    const r = audit.result || {};
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `SEO Audit — ${client.name}` } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const h = (t) => { doc.moveDown(0.8).font('Helvetica-Bold').fontSize(13).fillColor('#0E6B6F').text(t).moveDown(0.3).fillColor('#12202B'); };
    const p = (t, o = {}) => doc.font('Helvetica').fontSize(10).fillColor('#12202B').text(t, o);
    const bullets = (arr) => (arr || []).forEach((i) => { p('•  ' + txt(i), { indent: 6 }); doc.moveDown(0.2); });

    doc.font('Helvetica-Bold').fontSize(20).fillColor('#12202B').text('SEO Audit Report');
    doc.font('Helvetica').fontSize(11).fillColor('#5B6B78').text(`${client.name} — ${client.websiteUrl}`);
    doc.text(`${client.city}, ${client.state} · ${new Date(audit.completedAt || audit.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}`);

    doc.moveDown(1).font('Helvetica-Bold').fontSize(36).fillColor('#0E6B6F').text(`${audit.overallScore ?? r.overall_score ?? '—'} / 100`);
    doc.font('Helvetica').fontSize(10).fillColor('#5B6B78').text('Overall SEO score');

    h('Executive summary'); p(r.executive_summary || '');

    h('Score breakdown');
    Object.entries(audit.scoreBreakdown || r.score_breakdown || {}).forEach(([k, v]) => p(`${LABELS[k] || k}: ${v}/100`));

    h('Critical issues'); bullets(r.critical_issues);
    h('Important issues'); bullets(r.important_issues);
    h('Quick wins (≤ 2 hours)'); bullets(r.quick_wins);

    h('Recommendations');
    (r.recommendations || []).forEach((x, i) => {
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#12202B').text(`${i + 1}. [${x.priority}] ${x.category} — impact ${x.estimated_impact}, effort ${x.effort}`);
      p('Finding: ' + x.finding, { indent: 10 }); p('Fix: ' + x.fix, { indent: 10 }); p('How we will know: ' + x.falsifiability_check, { indent: 10 });
      doc.moveDown(0.5);
    });
    doc.end();
  });
}
module.exports = { pdfkitBuffer };