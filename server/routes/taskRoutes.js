const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, taskController.getAllTasks);
router.get('/:id', authenticate, taskController.getTaskById);
router.post('/', authenticate, authorize(['admin', 'project_manager', 'team_member', 'member']), taskController.createTask);
router.put('/:id', authenticate, authorize(['admin', 'project_manager', 'team_member', 'member']), taskController.updateTask);
router.delete('/:id', authenticate, authorize(['admin', 'project_manager']), taskController.deleteTask);
router.post('/:id/comments', authenticate, taskController.addTaskComment);

module.exports = router;
