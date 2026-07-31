const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load server/.env explicitly

const createTransporter = async () => {
  if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD
      }
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
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: process.env.SMTP_EMAIL ? `"Project Management System" <${process.env.SMTP_EMAIL}>` : '"PMS Alerts" <no-reply@pms.com>',
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    
    if (!process.env.SMTP_EMAIL) {
      console.log(`\n=============================================`);
      console.log(`[Email Simulation] Test Mail Sent!`);
      console.log(`View Email here: ${nodemailer.getTestMessageUrl(info)}`);
      console.log(`=============================================\n`);
    }
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = { sendEmail };
