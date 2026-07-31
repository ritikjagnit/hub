const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, meetingController.createMeeting);
router.get('/', authenticate, meetingController.getMeetings);
router.put('/:id', authenticate, meetingController.updateMeeting);
router.delete('/:id', authenticate, meetingController.deleteMeeting);

module.exports = router;
