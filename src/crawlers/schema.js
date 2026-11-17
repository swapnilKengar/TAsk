// Step 4 — Schema.org (JSON-LD) extraction + lightweight validation.
const cheerio = require('cheerio');

const REQUIRED = {
  LocalBusiness: ['name', 'address', 'telephone'],
  Dentist: ['name', 'address', 'telephone'],
  MedicalClinic: ['name', 'address', 'telephone'],
  Organization: ['name', 'url'],
  WebSite: ['name', 'url'],
  FAQPage: ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
};
const LOCAL_TYPES = ['LocalBusiness', 'Dentist', 'MedicalClinic', 'MedicalBusiness', 'Physician', 'Hospital', 'RealEstateAgent', 'HealthAndBeautyBusiness'];
const RECOMMENDED_LOCAL = ['openingHoursSpecification', 'geo', 'priceRange', 'sameAs', 'image'];

function flatten(node, out = []) {
  if (Array.isArray(node)) node.forEach((n) => flatten(n, out));
  else if (node && typeof node === 'object') {
    if (node['@graph']) flatten(node['@graph'], out);
    else out.push(node);
  }
  return out;
}

function validateSchema(html) {
  const $ = cheerio.load(html);
  const raw = $('script[type="application/ld+json"]').map((_, el) => $(el).contents().text()).get();
  const items = [];
  const issues = [];
  let invalidBlocks = 0;

  raw.forEach((txt, i) => {
    try { flatten(JSON.parse(txt), items); }
    catch (e) { invalidBlocks++; issues.push(`JSON-LD block ${i + 1} is not valid JSON: ${e.message}`); }
  });

  const types = [];
  items.forEach((it) => {
    const ts = [].concat(it['@type'] || []);
    ts.forEach((t) => {
      types.push(t);
      (REQUIRED[t] || []).forEach((f) => { if (it[f] === undefined) issues.push(`${t} is missing required property "${f}"`); });
      if (LOCAL_TYPES.includes(t)) RECOMMENDED_LOCAL.forEach((f) => { if (it[f] === undefined) issues.push(`${t} is missing recommended property "${f}"`); });
    });
  });

  const hasLocalBusiness = types.some((t) => LOCAL_TYPES.includes(t));
  if (!hasLocalBusiness) issues.push('No LocalBusiness-family schema found (e.g. LocalBusiness / Dentist / MedicalClinic)');

  return { found: raw.length > 0, blocks: raw.length, invalidBlocks, types: [...new Set(types)], hasLocalBusiness, issues };
}
module.exports = { validateSchema };