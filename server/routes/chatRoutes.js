const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, chatController.getMessages);
router.post('/', authenticate, chatController.sendMessage);
router.put('/:id', authenticate, chatController.editMessage);
router.delete('/:id', authenticate, chatController.deleteMessage);

module.exports = router;

