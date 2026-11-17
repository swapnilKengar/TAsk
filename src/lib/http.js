// Small fetch wrapper: timeout, http(s) only, never throws.
async function fetchText(url, { timeoutMs = 10000 } = {}) {
  const started = Date.now();
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only http(s) URLs are allowed');
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(u, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'EdgelinkSEOBot/1.0 (+audit)', Accept: 'text/html,application/xml,text/plain,*/*' },
    });
    const text = await res.text();
    clearTimeout(t);
    return { ok: res.ok, status: res.status, text, ms: Date.now() - started, finalUrl: res.url, headers: Object.fromEntries(res.headers) };
  } catch (e) {
    return { ok: false, status: 0, text: '', ms: Date.now() - started, finalUrl: url, headers: {}, error: e.message };
  }
}
module.exports = { fetchText };