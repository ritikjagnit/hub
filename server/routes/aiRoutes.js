const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { authenticate } = require('../middleware/auth');

router.post('/generate-tasks', authenticate, aiController.generateTasks);
router.post('/project-plan', authenticate, aiController.generateProjectPlan);
router.get('/detect-risks/:project_id', authenticate, aiController.detectRisks);
router.post('/summarize-meeting', authenticate, aiController.summarizeMeeting);
router.post('/chat-assistant', authenticate, aiController.chatAssistant);
router.get('/generate-report/:project_id', authenticate, aiController.generateReport);
router.post('/academic-assistant', authenticate, aiController.academicAssistant);

module.exports = router;
