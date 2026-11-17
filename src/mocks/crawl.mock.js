// Fallback used ONLY when USE_MOCKS=true and the client's URL can't be fetched
// (e.g. the seeded demo domain doesn't exist). The real Cheerio analysers still run on this HTML.
module.exports = {
  html: `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Home - Example Dental Clinic</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"Example Dental Clinic","url":"https://example-dental-clinic.com"}</script>
</head><body>
<header><nav><a href="/">Home</a> <a href="/services">Services</a> <a href="/about">About</a> <a href="/contact">Contact</a></nav></header>
<main>
<h1>Welcome to Example Dental Clinic</h1>
<h1>Your smile, our priority</h1>
<p>We are a family dental clinic in Pune offering general dentistry, root canal treatment, dental implants, teeth whitening, braces and clear aligners. Our team has over fifteen years of experience caring for patients across Kothrud, Baner and Aundh.</p>
<h2>Our services</h2>
<p>From routine check-ups and cleaning to complex tooth extraction and implant surgery, we use modern sterilised equipment and painless techniques so every visit is comfortable.</p>
<img src="/img/clinic.jpg" alt="Clinic reception">
<img src="/img/doctor.jpg">
<img src="/img/chair.jpg">
<img src="/img/implants.jpg" alt="">
<h2>Why patients choose us</h2>
<p>Transparent pricing, same-day appointments and flexible payment options. Call us or book online to schedule your visit today.</p>
<a href="/contact">Book an appointment</a>
<a href="https://maps.google.com/?q=example-dental-clinic">Find us on Google Maps</a>
</main></body></html>`,
  robotsTxt: 'User-agent: *\nDisallow: /wp-admin/\nDisallow: /cart/\n',
  sitemapXml: null,
};