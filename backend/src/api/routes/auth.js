const express = require('express');
const router = express.Router();
const { register, login, getProfile, assignRole } = require('../controllers/authController');

const { authenticate, authorize } = require('../middleware/auth');
const { authRateLimiter, checkAccountLockout } = require('../middleware/authRateLimiter');
const { validateSchema } = require('../middleware/schemaValidator');

// Public routes with rate limiting and schema validation
router.post('/register', authRateLimiter, validateSchema('register'), register);
router.post('/login', authRateLimiter, checkAccountLockout, validateSchema('login'), login);

// Protected routes
router.get('/profile', authenticate, getProfile);

// Admin-only route for role assignment (for simulation purposes)
router.post('/assign-role', authenticate, authorize('admin'), assignRole);

module.exports = router;
