const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/register-admin', authController.registerAdmin);
router.post('/verify-account', authController.verifyAccount);
router.post('/login', authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/forgot-password', authController.forgotPassword);

// Google simulation verification routes
router.post('/send-verification-code', authController.sendVerificationCode);
router.post('/verify-verification-code', authController.verifyVerificationCode);

// Real Firebase authentication route
router.post('/firebase-login', authController.firebaseLogin);

module.exports = router;
