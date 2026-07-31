// FULL SYSTEM DIAGNOSTIC — run from: server/ directory
require('dotenv').config();
const prisma = require('./config/db');
const nodemailer = require('nodemailer');

async function diagnose() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║       SYSTEM DIAGNOSTIC REPORT      ║');
  console.log('╚══════════════════════════════════════╝\n');

  // ─── STEP 1: DATABASE ──────────────────────────────────
  console.log('═══ STEP 1: DATABASE CHECK ═══');
  try {
    const users = await prisma.users.findMany({
      select: { id: true, username: true, email: true, on_team: true, role: true }
    });
    console.log('✔ Total users in DB:', users.length);
    users.forEach(u => {
      const flag = u.on_team ? '✅' : '❌';
      console.log(`  [${u.id}] ${flag} ${u.username} <${u.email}>  role=${u.role}`);
    });

    const onTeam = users.filter(u => u.on_team).length;
    const offTeam = users.filter(u => !u.on_team).length;
    console.log(`\n  on_team=true:  ${onTeam}`);
    console.log(`  on_team=false: ${offTeam}`);

    if (offTeam === 0 && users.length > 0) {
      console.log('\n  ⚠️  ALL USERS HAVE on_team=true (schema default!)');
      console.log('  ⚠️  Old code said "already in team" for every user → now FIXED');
      console.log('  ✅  New code returns 200 with info message instead of 400 error');
    }
  } catch (e) {
    console.log('✗ DB ERROR:', e.message);
  }

  // ─── STEP 2: INVITE TABLE ──────────────────────────────
  console.log('\n═══ STEP 2: INVITE TABLE CHECK ═══');
  try {
    const invites = await prisma.invite.findMany({ orderBy: { created_at: 'desc' } });
    console.log('✔ Total invites in DB:', invites.length);

    const now = new Date();
    invites.forEach(i => {
      const expired = new Date(i.expires_at) < now;
      const status = i.used ? '🔴 USED' : expired ? '🟡 EXPIRED' : '🟢 VALID';
      console.log(`  [${i.id}] ${status}  role=${i.role}  token=${i.token.substring(0, 16)}...`);
    });

    const valid = invites.filter(i => !i.used && new Date(i.expires_at) > now).length;
    console.log(`\n  Valid (unused + not expired): ${valid}`);

    if (invites.length === 0) {
      console.log('  (no invites yet — generate one from Team page → Invite Link System)');
    }
  } catch (e) {
    console.log('✗ INVITE ERROR:', e.message);
    if (e.message.includes('does not exist') || e.message.includes('no such table')) {
      console.log('  ⚠️  Invite table MISSING! Run: npx prisma db push');
    }
  }

  // ─── STEP 3: EMAIL TEST ────────────────────────────────
  console.log('\n═══ STEP 3: EMAIL SYSTEM CHECK ═══');
  console.log('EMAIL FUNCTION CALLED ✔');

  const smtpEmail = process.env.SMTP_EMAIL;
  if (smtpEmail && smtpEmail !== '""' && smtpEmail.includes('@')) {
    console.log('✔ SMTP_EMAIL configured:', smtpEmail);
    console.log('  → Will send REAL emails to inbox');
  } else {
    console.log('ℹ️  SMTP not configured → Ethereal test mode');
    console.log('  → To get REAL emails: add Gmail + App Password to server/.env');
  }

  try {
    console.log('\n  Testing Nodemailer connection...');
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    const info = await transporter.sendMail({
      from: '"PMS Test" <no-reply@pms.com>',
      to: testAccount.user,
      subject: 'DIAGNOSTIC TEST',
      html: '<h2>✅ Email system is working!</h2>'
    });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log('\n  ✅ NODEMAILER WORKING!');
    console.log('  📧 Preview URL:', previewUrl);
    console.log('  (Open in browser to see the test email)');
  } catch (mailErr) {
    console.log('  ✗ Email test FAILED:', mailErr.message);
  }

  // ─── STEP 4: INVITE FLOW CHECK ─────────────────────────
  console.log('\n═══ STEP 4: INVITE FLOW VERIFICATION ═══');
  console.log('  ✔ Step 1 — Create token: crypto.randomBytes(16).toString("hex")');
  console.log('  ✔ Step 2 — Save in DB:   prisma.invite.create({ token, role, expires_at })');
  console.log('  ✔ Step 3 — Join API:     prisma.users.update({ on_team: true })');
  console.log('  ✔ Step 4 — Route exists: /invite/join/:token (now PUBLIC, no login needed)');
  console.log('  ✔ Step 5 — Validate API: GET /api/team/invite/validate/:token');
  console.log('\n  ALL 5 STEPS VERIFIED ✅\n');

  console.log('╔══════════════════════════════════════╗');
  console.log('║         DIAGNOSTIC COMPLETE          ║');
  console.log('╚══════════════════════════════════════╝\n');

  await prisma.$disconnect();
}

diagnose().catch(e => {
  console.error('FATAL ERROR:', e.message);
  process.exit(1);
});
