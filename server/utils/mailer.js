const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const createTransporter = async () => {
  const user = (process.env.SMTP_EMAIL || '').trim();
  const pass = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

  if (user && pass) {
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // Use SSL for 100% reliable cloud delivery
      auth: { user, pass }
    });
  } else {
    // Fallback to test ethereal account
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

const sendEmail = async ({ to, subject, html }) => {
  if (!to) {
    console.warn('[Mailer Warning] Skipped sending email: "to" address is empty');
    return null;
  }

  const cleanTo = (Array.isArray(to) ? to.join(',') : to).trim().toLowerCase();
  const user = (process.env.SMTP_EMAIL || '').trim();

  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: user ? `"Project Hub" <${user}>` : '"Project Hub" <no-reply@pms.com>',
      to: cleanTo,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer Success] Email delivered to: ${cleanTo} | MessageID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Mailer Error] Failed to deliver email to ${cleanTo}:`, error.message);
    // Don't throw error to prevent breaking background API flows
    return null;
  }
};

module.exports = { sendEmail };
