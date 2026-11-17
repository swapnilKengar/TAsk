async function sendEmail(to, subject, pdfPath, score) {
  console.log('[MOCK EMAIL] → To:     ', to);
  console.log('[MOCK EMAIL] → Subject:', subject);
  console.log('[MOCK EMAIL] → Score:  ', score + '/100');
  console.log('[MOCK EMAIL] → Report: ', pdfPath);
  return { status: 'mock_sent', id: 'MOCK_EMAIL_' + Date.now() };
}
module.exports = { sendEmail };