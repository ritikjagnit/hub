const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { authenticate, authorize } = require('../middleware/auth');

// Old endpoints for backward compatibility
router.get('/', authenticate, teamController.getTeamList);
router.get('/search-users', authenticate, authorize(['admin', 'project_manager']), teamController.searchUsers);
router.post('/add-member', authenticate, authorize(['admin']), teamController.addTeamMember);
router.put('/:userId/role', authenticate, authorize(['admin']), teamController.updateUserRole);
router.delete('/:userId', authenticate, authorize(['admin']), teamController.deleteUser);

// MVP (Master Prompt) Endpoints
router.get('/members', authenticate, teamController.getTeamList);
router.post('/add', authenticate, authorize(['admin']), teamController.addTeamMember);
router.post('/add-by-email', authenticate, authorize(['admin']), teamController.addMemberByEmail);
router.delete('/remove/:userId', authenticate, authorize(['admin']), teamController.deleteUser);
router.put('/role/:userId', authenticate, authorize(['admin']), teamController.updateUserRole);
router.get('/search', authenticate, teamController.searchActiveMembers);

// Invite System Endpoints
router.post('/invite/create', authenticate, authorize(['admin']), teamController.createInvite);
router.get('/invite/validate/:token', teamController.validateInvite);          // PUBLIC — no auth
router.post('/invite/join/:token', authenticate, teamController.joinInvite);

// Attendance & Time Logging
router.post('/attendance', authenticate, teamController.logAttendance);
router.get('/attendance', authenticate, teamController.getAttendance);
router.post('/time', authenticate, teamController.logTime);
router.get('/time', authenticate, teamController.getTimeLogs);
router.post('/reset-database', authenticate, authorize(['admin']), teamController.resetDatabase);

module.exports = router; // restart trigger

