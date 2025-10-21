let nodemailer = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  nodemailer = null; // Optional dependency; service will no-op if unavailable
}

let transporter;

function getTransporter() {
  if (transporter) return transporter;
  if (!nodemailer) return null;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) return null;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
  return transporter;
}

async function sendOtp(to, code) {
  const t = getTransporter();
  if (!t) {
    console.warn('[emailService] Email transport unavailable (missing nodemailer or SMTP config). Skipping send.');
    return;
  }
  const from = process.env.SMTP_FROM || 'no-reply@studyhive.app';
  const subject = 'Your StudyHive verification code';
  const text = `Your verification code is: ${code}`;
  const html = `<p>Your verification code is: <b>${code}</b></p>`;
  await t.sendMail({ from, to, subject, text, html });
}

module.exports = { sendOtp };
