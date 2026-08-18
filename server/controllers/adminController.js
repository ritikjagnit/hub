const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');

// ────────── Audit Logs ──────────

exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { Users: { select: { username: true, email: true } } },
      orderBy: { created_at: 'desc' }
    });

    const formatted = logs.map(l => ({
      ...l,
      username: l.Users?.username || 'System'
    }));

    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
};

// ────────── Subscription Plans ──────────

let currentSubscription = {
  planName: 'Enterprise Growth',
  billingCycle: 'Monthly',
  renewalDate: '2026-12-31',
  cost: '$249.00',
  maxUsers: 50,
  maxStorageGB: 500
};

exports.getSubscriptionInfo = (req, res) => {
  res.json(currentSubscription);
};

exports.updateSubscriptionInfo = (req, res) => {
  const { planName, billingCycle, renewalDate, cost, maxUsers, maxStorageGB } = req.body;

  currentSubscription = {
    planName: planName || currentSubscription.planName,
    billingCycle: billingCycle || currentSubscription.billingCycle,
    renewalDate: renewalDate || currentSubscription.renewalDate,
    cost: cost || currentSubscription.cost,
    maxUsers: maxUsers ? parseInt(maxUsers) : currentSubscription.maxUsers,
    maxStorageGB: maxStorageGB ? parseInt(maxStorageGB) : currentSubscription.maxStorageGB
  };

  res.json({ message: 'Subscription details updated successfully', currentSubscription });
};

// ────────── System Settings ──────────

let systemSettings = {
  appName: 'Ascent Project Hub',
  allowPublicRegistration: false,
  enforceCompanyEmail: true,
  idleTimeoutMinutes: 60,
  enableSfa: false,
  timezone: 'UTC+05:30'
};

exports.getSystemSettings = (req, res) => {
  res.json(systemSettings);
};

exports.updateSystemSettings = (req, res) => {
  const { appName, allowPublicRegistration, enforceCompanyEmail, idleTimeoutMinutes, enableSfa, timezone } = req.body;

  systemSettings = {
    appName: appName || systemSettings.appName,
    allowPublicRegistration: allowPublicRegistration !== undefined ? !!allowPublicRegistration : systemSettings.allowPublicRegistration,
    enforceCompanyEmail: enforceCompanyEmail !== undefined ? !!enforceCompanyEmail : systemSettings.enforceCompanyEmail,
    idleTimeoutMinutes: idleTimeoutMinutes !== undefined ? parseInt(idleTimeoutMinutes) : systemSettings.idleTimeoutMinutes,
    enableSfa: enableSfa !== undefined ? !!enableSfa : systemSettings.enableSfa,
    timezone: timezone || systemSettings.timezone
  };

  res.json({ message: 'System configurations updated successfully', systemSettings });
};

// ────────── Backup & Restore ──────────

const getDatabaseFilePath = () => {
  const primaryPath = path.resolve(__dirname, '../project.db');
  if (fs.existsSync(primaryPath)) return primaryPath;
  const secondaryPath = path.resolve(__dirname, '../config/project.db');
  if (fs.existsSync(secondaryPath)) return secondaryPath;
  return primaryPath;
};

exports.backupDatabase = async (req, res) => {
  try {
    const dbPath = getDatabaseFilePath();
    const backupDir = path.resolve(__dirname, '../backups');

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupName = `backup_${Date.now()}.db`;
    const backupPath = path.join(backupDir, backupName);

    fs.copyFileSync(dbPath, backupPath);

    // Register log
    await prisma.auditLog.create({
      data: {
        user_id: req.user.id,
        action: 'BACKUP_DATABASE',
        details: `Backup generated successfully: ${backupName}`
      }
    });

    res.json({
      message: 'Database backup generated successfully!',
      filename: backupName,
      timestamp: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: 'Backup creation failed: ' + err.message });
  }
};

exports.restoreDatabase = async (req, res) => {
  const { filename } = req.body;
  if (!filename) {
    return res.status(400).json({ message: 'Backup file name is required' });
  }

  try {
    const dbPath = getDatabaseFilePath();
    const backupPath = path.resolve(__dirname, '../backups', filename);

    if (!fs.existsSync(backupPath)) {
      return res.status(404).json({ message: 'Backup file not found in storage' });
    }

    // Overwrite the sqlite DB with backup file
    fs.copyFileSync(backupPath, dbPath);

    // Register log
    await prisma.auditLog.create({
      data: {
        user_id: req.user.id,
        action: 'RESTORE_DATABASE',
        details: `Workspace database restored to historical snapshot: ${filename}`
      }
    });

    res.json({ message: 'Database successfully restored! Server will reload settings.' });
  } catch (err) {
    res.status(500).json({ message: 'Database restoration failed: ' + err.message });
  }
};

exports.getBackupsList = (req, res) => {
  try {
    const backupDir = path.resolve(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      return res.json([]);
    }

    const files = fs.readdirSync(backupDir);
    const backups = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return {
          filename: f,
          sizeBytes: stats.size,
          created_at: stats.birthtime
        };
      });

    res.json(backups);
  } catch (err) {
    res.status(500).json({ message: 'Error reading backups: ' + err.message });
  }
};
