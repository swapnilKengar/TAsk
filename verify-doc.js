// Doc-conformance test. Needs: dev server running (npm run dev) + worker running (node src/worker/index.js).
require('dotenv').config();
const { execFileSync } = require('child_process');
const { prisma } = require('./src/lib/prisma');
const { STEPS } = require('./src/lib/steps');

const BASE = process.env.VERIFY_BASE_URL || 'http://localhost:3000';
const baseHeaders = { 'content-type': 'application/json' };
if (process.env.ADMIN_PASSWORD) {
  baseHeaders.authorization = 'Basic ' + Buffer.from(`${process.env.ADMIN_USER || 'admin'}:${process.env.ADMIN_PASSWORD}`).toString('base64');
}
const SECRET = process.env.CRON_SECRET;

let fails = 0;
const ok = (m) => console.log('  ✓', m);
const bad = (m) => { fails++; console.log('  ✗', m); };
const check = (c, m) => (c ? ok(m) : bad(m));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(path, opts = {}) {
  const res = await fetch(BASE + path, { ...opts, headers: { ...baseHeaders, ...(opts.headers || {}) } });
  const type = res.headers.get('content-type') || '';
  if (type.includes('application/json')) return { status: res.status, type, body: await res.json() };
  return { status: res.status, type, buf: Buffer.from(await res.arrayBuffer()) };
}

// Runs code in a fresh Node process so USE_MOCKS is read at require-time with the value we choose.
function runNode(code, env) {
  const out = execFileSync(process.execPath, ['-e', code], {
    env: { ...process.env, ...env }, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
  });
  const line = out.split('\n').find((l) => l.startsWith('RESULT:'));
  return line ? line.slice(7) : out;
}

(async () => {
  console.log('\n1. USE_MOCKS toggle (doc section 2.2)');
  try {
    const on = JSON.parse(runNode(`
      const {getPageSpeed}=require('./src/crawlers/pagespeed');
      const {getSearchConsole}=require('./src/crawlers/gsc');
      const {getRankings}=require('./src/crawlers/dataforseo');
      (async()=>{
        const p=await getPageSpeed('https://x.com'), g=await getSearchConsole('https://x.com');
        const r=await getRankings({businessType:'a',city:'b',state:'c',websiteUrl:'https://x.com'});
        console.log('RESULT:'+JSON.stringify({perf:p.categories.performance.score,clicks:g.totalClicks,rank:r.client_rank_position}));
      })();`, { USE_MOCKS: 'true' }));
    check(on.perf === 0.61 && on.clicks === 167 && on.rank === 4, 'USE_MOCKS=true returns the supplied mock data');

    const off = runNode(`
      require('./src/crawlers/gsc').getSearchConsole('https://x.com')
        .then(() => console.log('RESULT:NO_ERROR'), (e) => console.log('RESULT:ERR ' + e.message));`,
      { USE_MOCKS: 'false', GSC_ACCESS_TOKEN: '' });
    check(off.startsWith('ERR'), 'USE_MOCKS=false takes the real-API path (no mock data returned)');

    const cl = (env) => JSON.parse(runNode(`
      require('./src/lib/claude').analyseWithClaude({}).then((r) => console.log('RESULT:' + JSON.stringify({ mocked: r.mocked })));`, env));
    check(cl({ USE_MOCKS: 'true', ANTHROPIC_API_KEY: 'sk-test', USE_REAL_CLAUDE: 'false' }).mocked === true, 'Claude is mocked when USE_MOCKS=true');
    check(cl({ USE_MOCKS: 'false', ANTHROPIC_API_KEY: '' }).mocked === true, 'Claude falls back to the mock when no API key is set');
  } catch (e) { bad('toggle test crashed: ' + e.message); }

  console.log('\n2. Master prompt + Claude contract (doc section 6.2)');
  try {
    const { SYSTEM_PROMPT, buildUserPrompt } = require('./src/lib/prompt');
    const { MODEL, validateResult } = require('./src/lib/claude');
    check(MODEL === 'claude-sonnet-4-6', 'model is claude-sonnet-4-6');
    ['senior SEO analyst with 15+ years', 'valid JSON only', 'falsifiability_check'].forEach((s) => check(SYSTEM_PROMPT.includes(s), 'system prompt contains: ' + s));
    const p = buildUserPrompt({ url: 'https://x.com', businessType: 'Dental clinic', city: 'Pune', state: 'Maharashtra', onPage: { a: 1 }, technical: { b: 2 }, cwv: { c: 3 }, schema: { d: 4 }, gsc: { e: 5 }, rankings: { f: 6 } });
    ['=== ON-PAGE DATA ===', '=== TECHNICAL DATA ===', '=== CORE WEB VITALS ===', '=== SCHEMA.ORG DATA ===', '=== GOOGLE SEARCH CONSOLE ===', '=== KEYWORD RANKINGS ===', 'Business location: Pune, Maharashtra, India', 'Business type: Dental clinic']
      .forEach((s) => check(p.includes(s), 'user prompt contains: ' + s));
    check(!/\{[A-Z_]+\}/.test(p), 'no unreplaced {VARIABLES}');
    const v = validateResult(require('./src/mocks/claude.mock'));
    check(v.critical_issues.length <= 5 && v.important_issues.length <= 8 && v.quick_wins.length <= 5, 'issue lists respect max 5 / 8 / 5');
  } catch (e) { bad('prompt test crashed: ' + e.message); }

  console.log('\n3. Pipeline order (doc section 3.2)');
  const expected = ['crawl', 'pagespeed', 'gsc', 'schema', 'onpage', 'technical', 'rankings', 'claude', 'store', 'pdf', 'notify'];
  check(JSON.stringify(STEPS.map((s) => s.id)) === JSON.stringify(expected), 'steps run in the documented order');

  console.log('\n4. API routes + live audit (doc section 6.1) — needs server + worker');
  let auditId = null, clientRow = null;
  try {
    const bad400 = await call('/api/audit', { method: 'POST', body: '{}' });
    check(bad400.status === 400, 'POST /api/audit without clientId → 400');

    clientRow = (await prisma.client.findFirst({ where: { websiteUrl: 'https://example-dental-clinic.com' } })) || (await prisma.client.findFirst());
    const post = await call('/api/audit', { method: 'POST', body: JSON.stringify({ clientId: clientRow.id }) });
    check(post.status === 202 && typeof post.body.auditId === 'string', 'POST /api/audit → 202 + { auditId }');
    auditId = post.body.auditId;

    const first = await call('/api/audit/' + auditId);
    ['status', 'progress', 'currentStep', 'overallScore', 'result'].forEach((k) => check(k in first.body, 'GET /api/audit/[id] returns ' + k));
    check(['QUEUED', 'RUNNING'].includes(first.body.status), 'new audit starts QUEUED/RUNNING (got ' + first.body.status + ')');
    check((await prisma.audit.findUnique({ where: { id: auditId } })).triggeredBy === 'manual', 'triggeredBy = manual');
    check((await call('/api/audit/does-not-exist')).status === 404, 'unknown audit id → 404');

    const seen = [];
    let last = first.body;
    for (let i = 0; i < 90 && last.status !== 'COMPLETED' && last.status !== 'FAILED'; i++) {
      await sleep(1000);
      last = (await call('/api/audit/' + auditId)).body;
      seen.push(last.progress);
    }
    check(last.status === 'COMPLETED', 'audit reached COMPLETED' + (last.status !== 'COMPLETED' ? ` (stuck at ${last.status} ${last.progress}% — is the worker running?)` : ''));
    check(seen.every((v, i) => i === 0 || v >= seen[i - 1]), 'progress never goes backwards');
    check(last.progress === 100, 'progress ends at 100');
    check(Number.isInteger(last.overallScore) && last.overallScore >= 0 && last.overallScore <= 100, 'overallScore is an integer 0–100');
    check(last.result?.recommendations?.length > 0, 'result has recommendations');

    const row = await prisma.audit.findUnique({ where: { id: auditId }, include: { notifications: true } });
    check(!!row.pdfPath, 'pdfPath saved');
    const channels = [clientRow.whatsapp && 'whatsapp', clientRow.email && 'email'].filter(Boolean);
    channels.forEach((c) => check(row.notifications.some((n) => n.channel === c && n.status === 'mock_sent'), 'Notification row: ' + c + ' / mock_sent'));

    const pdf = await call('/api/report/' + auditId);
    check(pdf.status === 200 && pdf.type.includes('application/pdf') && pdf.buf.slice(0, 4).toString() === '%PDF', 'GET /api/report/[id] returns a real PDF');
  } catch (e) { bad('API test crashed (is npm run dev running?): ' + e.message); }

  console.log('\n5. Cron route + monthly audits (doc section 6.1)');
  let tmp = null;
  try {
    check((await call('/api/cron/audits')).status === 401, 'cron without secret → 401');
    check((await call('/api/cron/audits', { headers: { 'x-cron-secret': 'wrong' } })).status === 401, 'cron with wrong secret → 401');
    const good = await call('/api/cron/audits', { headers: { 'x-cron-secret': SECRET } });
    check(good.status === 200 && good.body.ok === true, 'cron with correct secret → 200 { ok: true }');

    tmp = await prisma.client.create({ data: { name: 'Cron Test Client', websiteUrl: `https://cron-test-${Date.now()}.invalid`, businessType: 'Test', city: 'Pune', state: 'Maharashtra' } });
    await prisma.audit.create({ data: { clientId: tmp.id, status: 'COMPLETED', progress: 100, createdAt: new Date(Date.now() - 31 * 864e5) } });
    const due = await call('/api/cron/audits', { headers: { 'x-cron-secret': SECRET } });
    const newest = await prisma.audit.findFirst({ where: { clientId: tmp.id }, orderBy: { createdAt: 'desc' } });
    check(due.body.enqueued?.includes(newest.id) && newest.triggeredBy === 'cron', 'client last audited 31 days ago gets a monthly audit (triggeredBy = cron)');
  } catch (e) { bad('cron test crashed: ' + e.message); }

  if (tmp) { // wait for the test audit to settle, then delete everything we created
    for (let i = 0; i < 60; i++) {
      const open = await prisma.audit.count({ where: { clientId: tmp.id, status: { in: ['QUEUED', 'RUNNING'] } } });
      if (!open) break;
      await sleep(1000);
    }
    try {
      await prisma.notification.deleteMany({ where: { audit: { clientId: tmp.id } } });
      await prisma.audit.deleteMany({ where: { clientId: tmp.id } });
      await prisma.client.delete({ where: { id: tmp.id } });
      console.log('  i test client cleaned up');
    } catch (e) { console.log('  i could not clean up the test client (delete "Cron Test Client" in /admin or Neon):', e.message); }
  }

  console.log(`\n${fails === 0 ? 'ALL DOC CHECKS PASSED' : fails + ' check(s) failed'}\n`);
  await prisma.$disconnect();
  process.exit(0);
})();