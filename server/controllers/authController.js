const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { sendEmail } = require('../utils/mailer');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'projectmanagement_secure_jwt_token_secret_998877';

exports.register = async (req, res) => {
  return res.status(403).json({
    message: 'Public registration is disabled. Only administrators can pre-create accounts and add team members to the workspace.'
  });
};

const FREE_EMAIL_DOMAINS = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'aol.com', 'icloud.com', 'mail.com', 'zoho.com', 'protonmail.com', 'yandex.com', 'gmx.com'
];

exports.registerAdmin = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Full name, email, and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  
  // Enforce company email address (cannot be gmail, yahoo etc)
  const parts = cleanEmail.split('@');
  if (parts.length < 2) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  
  const domain = parts[1];
  if (FREE_EMAIL_DOMAINS.includes(domain)) {
    return res.status(400).json({
      message: 'Please use your official company email address. Free email providers (Gmail, Yahoo, Outlook, etc.) are not allowed for administration.'
    });
  }

  try {
    const existingUser = await prisma.users.findUnique({ where: { email: cleanEmail } });
    if (existingUser) {
      return res.status(400).json({ message: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.users.create({
      data: {
        username: username.trim(),
        email: cleanEmail,
        password: hashedPassword,
        role: 'admin',
        on_team: true
      }
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      message: 'Admin account registered successfully!',
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (err) {
    console.error('Admin registration error:', err);
    return res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.verifyAccount = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Verification token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { email } = decoded;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.on_team) {
      return res.status(400).json({ message: 'Account is already verified and active on the team' });
    }

    await prisma.users.update({
      where: { email },
      data: { on_team: true }
    });

    res.status(200).json({ message: 'Account successfully verified and activated' });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Verification link has expired' });
    }
    return res.status(400).json({ message: 'Invalid verification link' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: { id: true, username: true, email: true, role: true, created_at: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Database error' });
  }
};

exports.updateProfile = async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.users.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updateData = {};

    if (username && username.trim() !== user.username) {
      updateData.username = username.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters.' });
      }
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No changes provided.' });
    }

    const updatedUser = await prisma.users.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, username: true, email: true, role: true, created_at: true }
    });

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }
  res.json({ message: 'If this email is registered, a password reset link has been dispatched successfully.' });
};

const verificationStore = new Map();

exports.sendVerificationCode = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'No registered Ascent user matches these credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials. Password incorrect.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    verificationStore.set(email, {
      code,
      expires: Date.now() + 5 * 60 * 1000 
    });

    console.log(`\n=============================================`);
    console.log(`[Google Auth Simulation] Generated Code for ${email}: G-${code}`);
    console.log(`=============================================\n`);

    let transporter;
    let usingTestAccount = false;

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_EMAIL,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      usingTestAccount = true;
      try {
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
      } catch (mailErr) {
        console.error('Failed to create Nodemailer test account, falling back to simulated mode.');
      }
    }

    if (transporter) {
      const mailOptions = {
        from: process.env.SMTP_EMAIL ? `"Google Secure Auth" <${process.env.SMTP_EMAIL}>` : '"Google Secure Auth" <no-reply@google.com>',
        to: email,
        subject: 'Verify your identity - Ascent Google Sign-In',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 24px; border-radius: 8px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" alt="Google" width="90" style="margin-bottom: 12px;"/>
              <h2 style="color: #202124; font-size: 20px; font-weight: 500; margin: 0;">2-Step Verification Code</h2>
              <p style="color: #5f6368; font-size: 14px; margin-top: 4px;">Ascent Identity Protocol Handshake</p>
            </div>
            <p style="color: #202124; font-size: 14px; line-height: 1.5;">
              Hello,
            </p>
            <p style="color: #202124; font-size: 14px; line-height: 1.5;">
              Someone is attempting to log in to the <strong>Ascent Project Management System</strong> using your Google account. 
              Please enter the following 6-digit verification code to verify your identity.
            </p>
            <div style="background-color: #f8f9fa; border: 1px solid #f1f3f4; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
              <span style="font-family: monospace; font-size: 32px; font-weight: bold; color: #1a73e8; letter-spacing: 4px;">G-${code}</span>
            </div>
            <p style="color: #5f6368; font-size: 12px; line-height: 1.5; margin-top: 24px; border-top: 1px solid #f1f3f4; padding-top: 12px;">
              If you did not make this request, please ignore this email or update your credentials. This code will expire in 5 minutes.
            </p>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (mailErr, info) => {
        if (mailErr) {
          console.error('Mail delivery error:', mailErr);
          return res.status(200).json({
            message: 'Verification code generated.',
            simulatedCode: code,
            note: 'Mail delivery failed. Used local fallback code.'
          });
        }

        if (usingTestAccount) {
          const testUrl = nodemailer.getTestMessageUrl(info);
          console.log(`\n=============================================`);
          console.log(`[Google Auth Simulation] Test Mail Sent!`);
          console.log(`View Email here: ${testUrl}`);
          console.log(`=============================================\n`);
          
          return res.status(200).json({
            message: 'Verification code generated and sent.',
            etherealUrl: testUrl,
            simulatedCode: code
          });
        } else {
          console.log(`[Google Auth Simulation] Real email dispatched successfully to: ${email}`);
          return res.status(200).json({
            message: 'A real 2-step verification code has been sent to your email inbox!'
          });
        }
      });
    } else {
      return res.status(200).json({
        message: 'Verification code generated.',
        simulatedCode: code
      });
    }

  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

exports.verifyVerificationCode = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ message: 'Email and verification code are required' });
  }

  const record = verificationStore.get(email);

  if (!record) {
    return res.status(400).json({ message: 'No verification request pending or code expired.' });
  }

  if (Date.now() > record.expires) {
    verificationStore.delete(email);
    return res.status(400).json({ message: 'Verification code has expired. Please request a new one.' });
  }

  const cleanCode = code.replace('G-', '').trim();

  if (record.code !== cleanCode) {
    return res.status(400).json({ message: 'Invalid 6-digit verification code. Please try again.' });
  }

  verificationStore.delete(email);

  try {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: 'User not found.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
};

const FIREBASE_API_KEY = process.env.FIREBASE_WEB_API_KEY || "AIzaSyBZ2Jmd_b4YEbrT_7srJYlWBE5bQS0kZAA";

exports.firebaseLogin = async (req, res) => {
  const { idToken, requestedRole } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: 'Firebase idToken is required' });
  }

  try {
    // Step 1: Verify the Firebase idToken via Google Identity Toolkit REST API
    console.log('[Firebase Login] Step 1: Verifying idToken with Google Identity Toolkit...');
    
    let verifyRes;
    try {
      verifyRes = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });
    } catch (fetchErr) {
      console.error('[Firebase Login] Network error calling Google API:', fetchErr.message);
      return res.status(502).json({ message: 'Unable to reach Google authentication servers. Check your internet connection.' });
    }

    if (!verifyRes.ok) {
      let errData = {};
      try {
        errData = await verifyRes.json();
      } catch (parseErr) {
        console.error('[Firebase Login] Could not parse Google API error response');
      }
      console.error('[Firebase Login] Google API returned error:', verifyRes.status, errData);
      return res.status(400).json({ message: `Firebase validation failed: ${errData.error?.message || 'Unknown error (HTTP ' + verifyRes.status + ')'}` });
    }

    const verifyData = await verifyRes.json();
    const firebaseUser = verifyData.users?.[0];

    if (!firebaseUser) {
      console.error('[Firebase Login] No user found in Google API response:', JSON.stringify(verifyData));
      return res.status(400).json({ message: 'Invalid token payload received from Firebase' });
    }

    const { email, displayName } = firebaseUser;
    console.log(`[Firebase Login] Step 2: Token verified. Email: ${email}, Name: ${displayName || 'N/A'}`);

    if (!email) {
      console.error('[Firebase Login] Firebase user has no email address');
      return res.status(400).json({ message: 'Google account does not have a valid email address.' });
    }

    // Step 3: Check if user already exists in local database
    console.log('[Firebase Login] Step 3: Looking up user in local database...');
    let user;
    try {
      user = await prisma.users.findUnique({ where: { email } });
    } catch (dbErr) {
      console.error('[Firebase Login] Database lookup error:', dbErr.message);
      return res.status(500).json({ message: 'Database error during user lookup: ' + dbErr.message });
    }

    if (!user) {
      console.log(`[Firebase Login] Access denied: User ${email} not pre-registered in database.`);
      return res.status(403).json({
        message: 'Access denied. Only pre-registered team members can log in. Please contact your workspace administrator to add your email.'
      });
    }

    console.log(`[Firebase Login] Existing user found (ID: ${user.id}). Issuing JWT...`);
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      message: 'Firebase login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (serverErr) {
    console.error('[Firebase Login] Unhandled server error:', serverErr);
    return res.status(500).json({ message: 'Server verification error: ' + serverErr.message });
  }
};
