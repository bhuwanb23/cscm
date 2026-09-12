const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');

const { authenticate } = require('../middleware/auth');
const { authRateLimiter, checkAccountLockout } = require('../middleware/authRateLimiter');
const { validateSchema } = require('../middleware/schemaValidator');

// Public routes with rate limiting and schema validation
router.post('/register', authRateLimiter, validateSchema('register'), register);
router.post('/login', authRateLimiter, checkAccountLockout, validateSchema('login'), login);

// Protected routes
router.get('/profile', authenticate, getProfile);

module.exports = router;
