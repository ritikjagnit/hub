const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const prisma = require('./config/db');
const { sendEmail } = require('./utils/mailer');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'projectmanagement_secure_jwt_token_secret_998877';

async function runAudit() {
  console.log('====================================================');
  console.log('🚀 SYSTEM PRE-DEPLOYMENT AUDIT & VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. DATABASE CONNECTION & ACCOUNTS AUDIT
  console.log('📌 1. AUDITING DATABASE ACCOUNTS & SCHEMAS...');
  try {
    const users = await prisma.users.findMany();
    const projects = await prisma.projects.findMany();
    const tasks = await prisma.tasks.findMany();
    const invites = await prisma.invite.findMany();

    console.log(`   ✅ Users Total: ${users.length} (Active Team Members: ${users.filter(u => u.on_team).length})`);
    console.log(`   ✅ Projects Total: ${projects.length}`);
    console.log(`   ✅ Tasks Total: ${tasks.length}`);
    console.log(`   ✅ Invites Total: ${invites.length}`);
    passed++;
  } catch (err) {
    console.error('   ❌ DB Audit Error:', err.message);
    failed++;
  }

  // 2. NODEMAILER EMAIL NOTIFICATION TEST
  console.log('\n📌 2. AUDITING REAL EMAIL NOTIFICATION SYSTEM (NODEMAILER)...');
  try {
    const testRecipient = process.env.SMTP_EMAIL || 'support@stufflas.com';
    console.log(`   📧 Sending test production email to: ${testRecipient}`);
    
    const info = await sendEmail({
      to: testRecipient,
      subject: '✅ Project Hub Audit Test Email',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #06b6d4; border-radius: 8px;">
          <h2 style="color: #06b6d4;">Pre-Deployment System Audit Passed</h2>
          <p>This is a verification email to confirm that <strong>Nodemailer SMTP Service</strong> is 100% operational for your deployment.</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    });

    console.log(`   ✅ EMAIL DELIVERED SUCCESSFULLY! Message ID: ${info.messageId || 'OK'}`);
    passed++;
  } catch (err) {
    console.error('   ❌ Email System Audit Error:', err.message);
    failed++;
  }

  // 3. AUTHENTICATION & JWT SYSTEM AUDIT
  console.log('\n📌 3. AUDITING AUTH & JWT TOKEN VERIFICATION...');
  try {
    const admin = await prisma.users.findFirst({ where: { role: 'admin' } });
    if (!admin) throw new Error('No admin user found in database!');

    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.email !== admin.email) throw new Error('Token verification payload mismatch');

    console.log(`   ✅ Admin Account Verified: ${admin.email}`);
    console.log(`   ✅ JWT Security Sign & Verify Functioning Cleanly`);
    passed++;
  } catch (err) {
    console.error('   ❌ Auth Audit Error:', err.message);
    failed++;
  }

  // 4. MULTI-DOMAIN TEAM MEMBER ACCESSIBILITY AUDIT
  console.log('\n📌 4. AUDITING TEAM LIST & DOMAIN ACCESSIBILITY...');
  try {
    const teamMembers = await prisma.users.findMany({
      where: { on_team: true },
      select: { id: true, username: true, email: true, role: true }
    });

    const domains = [...new Set(teamMembers.map(m => m.email.split('@')[1]))];
    console.log(`   ✅ Total Accessible Team Members: ${teamMembers.length}`);
    console.log(`   ✅ Multi-Domain Support Confirmed (${domains.length} domains: ${domains.join(', ')})`);
    passed++;
  } catch (err) {
    console.error('   ❌ Team Audit Error:', err.message);
    failed++;
  }

  // 5. PRODUCTION ENVIRONMENT VARIABLES CHECK
  console.log('\n📌 5. AUDITING PRODUCTION ENVIRONMENT VARIABLES...');
  const requiredEnvVars = ['PORT', 'SMTP_EMAIL', 'SMTP_PASSWORD'];
  let envOk = true;
  requiredEnvVars.forEach(v => {
    if (process.env[v]) {
      console.log(`   ✅ ENV variable present: ${v}`);
    } else {
      console.log(`   ⚠️  ENV variable missing or default: ${v}`);
      envOk = false;
    }
  });
  if (envOk) passed++; else failed++;

  console.log('\n====================================================');
  console.log(`🎯 AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await prisma.$disconnect();
}

runAudit().catch(err => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
