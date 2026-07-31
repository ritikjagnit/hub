const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/org', authenticate, authorize(['admin']), workspaceController.createOrganization);
router.get('/org', authenticate, workspaceController.getOrganizations);
router.get('/org/my', authenticate, workspaceController.getMyOrganization);

router.post('/team', authenticate, authorize(['admin', 'project_manager', 'manager']), workspaceController.createTeam);
router.get('/team', authenticate, workspaceController.getTeams);

router.post('/department', authenticate, authorize(['admin', 'project_manager', 'manager']), workspaceController.createDepartment);
router.get('/department', authenticate, workspaceController.getDepartments);

router.get('/employees', authenticate, workspaceController.getEmployees);
router.put('/employees/update', authenticate, authorize(['admin', 'project_manager', 'manager']), workspaceController.assignEmployeeDetails);

router.post('/invite', authenticate, authorize(['admin', 'project_manager', 'manager']), workspaceController.inviteMember);

module.exports = router;
