// Realistic mock of the Claude audit JSON (same structure as the master prompt).
// Static narrative written for the demo dental-clinic signals.
module.exports = {
  audit_version: 'v1.0',
  overall_score: 58,
  score_breakdown: { technical: 64, on_page: 52, content: 55, core_web_vitals: 58, schema: 30 },
  critical_issues: [
    'Mobile Largest Contentful Paint is 4.2 s against Google\'s 2.5 s "good" threshold, which suppresses rankings for competitive local queries.',
    'No LocalBusiness / Dentist structured data — only a bare Organization block — so Google cannot confidently show hours, address or ratings.',
    'No sitemap.xml was found and robots.txt has no Sitemap directive, while Search Console reports 3 index coverage errors.',
    'The homepage has no meta description, leaving the snippet to be auto-generated.'
  ],
  important_issues: [
    'The page has two H1 tags with competing messages; "dental clinic in Pune" is not in any heading.',
    'Title tag is the generic "Home - Example Dental Clinic" and contains no service or city keyword.',
    '3 of 4 images have missing or empty alt text.',
    'No canonical tag is declared on the homepage.',
    '2 render-blocking resources and 420 KiB of unused JavaScript slow first paint.',
    'Interaction to Next Paint is 280 ms — above the 200 ms "good" threshold.',
    '"dental implants cost pune" ranks at position 11.3 and "dentist near me" at 9.4 — both just off page one.'
  ],
  quick_wins: [
    'Write a 140–155 character meta description with the city and a booking call-to-action.',
    'Rewrite the title to "Dental Clinic in Pune — Implants, RCT & Braces | Example Dental Clinic".',
    'Add descriptive alt text to the three images missing it.',
    'Add a self-referencing canonical tag.',
    'Merge to a single H1 containing "Dental Clinic in Pune".'
  ],
  recommendations: [
    {
      priority: 'CRITICAL', category: 'CWV',
      finding: 'Mobile LCP is 4.2 s; unused JavaScript (420 KiB) and 2 render-blocking resources delay the hero content.',
      fix: 'Preload and compress the hero image (WebP, explicit width/height), defer non-critical JS, inline critical CSS and remove unused scripts.',
      estimated_impact: 'High', effort: 'Days',
      falsifiability_check: 'Re-run PageSpeed Insights (mobile) after deploy: LCP should be ≤ 2.5 s and the performance score ≥ 0.80. CrUX LCP p75 should improve within 28 days.'
    },
    {
      priority: 'CRITICAL', category: 'Schema',
      finding: 'Only a minimal Organization schema exists; no Dentist/LocalBusiness markup with address, geo, opening hours or phone.',
      fix: 'Add JSON-LD of type Dentist with name, address, geo, telephone, openingHoursSpecification, priceRange and sameAs links; add FAQPage for treatment FAQs.',
      estimated_impact: 'High', effort: 'Hours',
      falsifiability_check: 'Google Rich Results Test shows valid Dentist items with zero errors; Search Console "Enhancements" lists the new items within two weeks.'
    },
    {
      priority: 'HIGH', category: 'Technical',
      finding: 'sitemap.xml returns 404, robots.txt declares no sitemap, and GSC reports 3 index coverage errors.',
      fix: 'Generate sitemap.xml with all indexable URLs, reference it in robots.txt, submit it in Search Console, then fix or redirect the 3 errored URLs.',
      estimated_impact: 'High', effort: 'Hours',
      falsifiability_check: 'Search Console shows the sitemap as "Success" with discovered URLs ≈ page count and index coverage errors drop from 3 to 0 within 14 days.'
    },
    {
      priority: 'HIGH', category: 'OnPage',
      finding: 'Missing meta description, generic title, and two competing H1s on the homepage.',
      fix: 'Rewrite title and meta description around "dental clinic in Pune" and keep one H1 that states the primary service and city.',
      estimated_impact: 'Medium', effort: 'Hours',
      falsifiability_check: 'GSC CTR for "dental clinic in pune" rises from 4.3% to ≥ 5.5% over four weeks with position held or improved.'
    },
    {
      priority: 'MEDIUM', category: 'Content',
      finding: 'Queries like "dental implants cost pune" (pos. 11.3) have no dedicated landing page.',
      fix: 'Publish a dedicated implants page covering cost ranges, process, aftercare and FAQs (≥ 800 words) and link it from the homepage and navigation.',
      estimated_impact: 'Medium', effort: 'Days',
      falsifiability_check: 'The page is indexed and "dental implants cost pune" moves into the top 10 in GSC within 6–8 weeks.'
    },
    {
      priority: 'LOW', category: 'OnPage',
      finding: 'Three images lack alt text and no canonical tag is set.',
      fix: 'Add descriptive alt text and a self-referencing rel=canonical on every page.',
      estimated_impact: 'Low', effort: 'Hours',
      falsifiability_check: 'Re-crawl shows 0 images without alt and canonical present on 100% of pages; PageSpeed accessibility score rises above 0.80.'
    }
  ],
  executive_summary: 'The site has a solid base but is losing local visitors to slow mobile loading and missing structured data. Fixing LCP, adding Dentist schema and submitting a sitemap should lift visibility for "dental clinic in Pune" within a month. Smaller on-page fixes can be shipped this week for quick gains.'
};