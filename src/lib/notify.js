// Step 11 — deliver report via WhatsApp + email. Mocked → console.log. Rows go to the Notification table.
const { USE_MOCKS } = require('../mocks');
const { sendWhatsApp: mockWhatsApp } = require('../mocks/twilio.mock');
const { sendEmail: mockEmail } = require('../mocks/email.mock');
const { prisma } = require('./prisma');

async function realWhatsApp(client, audit) {
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_WHATSAPP_FROM: from, APP_URL } = process.env;
  if (!sid || !token || !from) throw new Error('Twilio env vars missing');
  const body = new URLSearchParams({
    From: `whatsapp:${from}`, To: `whatsapp:${client.whatsapp}`,
    Body: `Your SEO audit is ready — score ${audit.overallScore}/100.`,
    MediaUrl: `${APP_URL}/api/report/${audit.id}`,
  });
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST', body,
    headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64') },
  });
  if (!res.ok) throw new Error(`Twilio ${res.status}`);
  return { status: 'sent', sid: (await res.json()).sid };
}

async function realEmail(client, audit) {
  const { RESEND_API_KEY: key, EMAIL_FROM: from, APP_URL } = process.env;
  if (!key || !from) throw new Error('Resend env vars missing');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from, to: client.email, subject: `Your SEO audit — ${audit.overallScore}/100`,
      html: `<p>Your SEO audit for ${client.websiteUrl} is ready.</p><p><a href="${APP_URL}/api/report/${audit.id}">Download the PDF report</a></p>`,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}`);
  return { status: 'sent', id: (await res.json()).id };
}

async function record(auditId, channel, status, providerId) {
  return prisma.notification.create({ data: { auditId, channel, status, providerId: providerId || null } });
}

async function sendReport({ client, audit, pdfPath }) {
  const sent = [];
  if (client.whatsapp) {
    try {
      const r = USE_MOCKS ? await mockWhatsApp(client.id, pdfPath, audit.overallScore) : await realWhatsApp(client, audit);
      sent.push(await record(audit.id, 'whatsapp', r.status, r.sid));
    } catch (e) { console.error('[NOTIFY] whatsapp failed:', e.message); sent.push(await record(audit.id, 'whatsapp', 'failed')); }
  }
  if (client.email) {
    try {
      const subject = `Your SEO audit — ${audit.overallScore}/100`;
      const r = USE_MOCKS ? await mockEmail(client.email, subject, pdfPath, audit.overallScore) : await realEmail(client, audit);
      sent.push(await record(audit.id, 'email', r.status, r.id));
    } catch (e) { console.error('[NOTIFY] email failed:', e.message); sent.push(await record(audit.id, 'email', 'failed')); }
  }
  return sent;
}
module.exports = { sendReport };