// Step 5 — on-page analysis with Cheerio.
const cheerio = require('cheerio');

function analyseOnPage(html, pageUrl) {
  const $ = cheerio.load(html);
  let origin = '';
  try { origin = new URL(pageUrl).origin; } catch {}

  const title = $('head title').first().text().trim();
  const metaDescription = ($('meta[name="description"]').attr('content') || '').trim();
  const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
  const imgs = $('img');
  const missingAlt = imgs.filter((_, el) => !($(el).attr('alt') || '').trim()).length;

  let internal = 0, external = 0, nofollow = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    if (/^(mailto:|tel:|javascript:|#)/i.test(href)) return;
    if ($(el).attr('rel')?.includes('nofollow')) nofollow++;
    try {
      const abs = new URL(href, pageUrl);
      abs.origin === origin ? internal++ : external++;
    } catch {}
  });

  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  return {
    title, titleLength: title.length,
    metaDescription, metaDescriptionLength: metaDescription.length,
    canonical: $('link[rel="canonical"]').attr('href') || null,
    robotsMeta: $('meta[name="robots"]').attr('content') || null,
    noindex: /noindex/i.test($('meta[name="robots"]').attr('content') || ''),
    lang: $('html').attr('lang') || null,
    hasViewport: $('meta[name="viewport"]').length > 0,
    h1Count: h1s.length, h1s,
    h2Count: $('h2').length, h3Count: $('h3').length,
    wordCount: bodyText ? bodyText.split(' ').length : 0,
    images: { total: imgs.length, missingAlt },
    links: { internal, external, nofollow },
    openGraph: { title: !!$('meta[property="og:title"]').length, image: !!$('meta[property="og:image"]').length },
    twitterCard: !!$('meta[name="twitter:card"]').length,
    textSample: bodyText.slice(0, 500),
  };
}
module.exports = { analyseOnPage };