const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// Audit logs
router.get('/audit-logs', authenticate, authorize(['admin']), adminController.getAuditLogs);

// Subscription details
router.get('/subscription', authenticate, authorize(['admin']), adminController.getSubscriptionInfo);
router.put('/subscription', authenticate, authorize(['admin']), adminController.updateSubscriptionInfo);

// System Settings
router.get('/settings', authenticate, authorize(['admin']), adminController.getSystemSettings);
router.put('/settings', authenticate, authorize(['admin']), adminController.updateSystemSettings);

// Backup & Restore
router.post('/backup', authenticate, authorize(['admin']), adminController.backupDatabase);
router.post('/restore', authenticate, authorize(['admin']), adminController.restoreDatabase);
router.get('/backups', authenticate, authorize(['admin']), adminController.getBackupsList);

module.exports = router;
