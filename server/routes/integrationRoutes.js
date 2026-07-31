const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, integrationController.getIntegrations);
router.put('/:id', authenticate, integrationController.toggleIntegration);
router.post('/webhook', integrationController.triggerMockWebhook);

module.exports = router;
