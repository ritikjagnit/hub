const express = require('express');
const router = express.Router();
const { verifyWebhook, handleWebhookEvents } = require('../controllers/instagramController');

// GET request for Webhook Verification (required by Meta/Instagram)
router.get('/webhook', verifyWebhook);

// POST request for receiving Webhook events
router.post('/webhook', handleWebhookEvents);

module.exports = router;
