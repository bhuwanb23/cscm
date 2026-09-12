const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config');
const logger = require('../../utils/logger');
const UserModel = require('../../models/userModel');
const { validatePassword } = require('../../utils/passwordValidator');
const { recordFailedAttempt, clearFailedAttempts } = require('../middleware/authRateLimiter');

const SALT_ROUNDS = 10;

/**
 * Generate JWT token for user authentication
 * @param {Object} user - User object containing id, username, and role
 * @returns {string} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiration }
  );
}

/**
 * Register a new user
 * @route POST /api/v1/auth/register
 * @group Authentication
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Register a new user with username, email, and password
 * @body {string} username.required - User's username
 * @body {string} email.required - User's email address
 * @body {string} password.required - User's password
 * @body {string} role - User's role (admin, user, guest) - defaults to 'user'
 * @response {201} User registered successfully
 * @response {400} Username, email, and password are required
 * @response {409} Username already exists
 * @response {500} Registration failed
 */
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required',
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    const existing = await UserModel.findByUsername(username);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists',
      });
    }

    // Default all new users to 'user' role - role assignment is not allowed during registration
    const defaultRole = 'user';
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const saved = await UserModel.create({ username, email, password: hashedPassword, role: defaultRole });

    const token = generateToken({ id: saved.id, username, role: defaultRole });

    logger.info(`User registered: ${username} with role: ${defaultRole}`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: saved.id, username, email, role: defaultRole },
        token,
      },
    });
  } catch (error) {
    console.error('Registration failed:', error.message, error.stack);
    logger.error('Registration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      details: error.message
    });
  }
}

/**
 * Login user with username and password
 * @route POST /api/v1/auth/login
 * @group Authentication
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Authenticate user and return JWT token
 * @body {string} username.required - User's username
 * @body {string} password.required - User's password
 * @response {200} Login successful with JWT token
 * @response {400} Username and password are required
 * @response {401} Invalid username or password
 * @response {500} Login failed
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required',
      });
    }

    const user = await UserModel.findByUsername(username);
    if (!user) {
      // Record failed attempt even if user doesn't exist (prevents username enumeration)
      recordFailedAttempt(username);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // Record failed attempt
      const lockoutInfo = recordFailedAttempt(username);
      
      if (lockoutInfo.isLocked) {
        return res.status(429).json({
          success: false,
          error: 'Account temporarily locked due to too many failed login attempts',
          retryAfter: Math.ceil(lockoutInfo.lockoutDuration / 1000)
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
      });
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(username);

    const token = generateToken({ id: user.id, username: user.username, role: user.role });

    logger.info(`User logged in: ${username}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        token,
      },
    });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      details: error.message
    });
  }
}

/**
 * Get user profile
 * @route GET /api/v1/auth/profile
 * @group Authentication
 * @security BearerAuth
 * @param {Request} req - Express request object with authenticated user
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 * @description Get current user's profile information
 * @response {200} User profile retrieved successfully
 * @response {401} Unauthorized - invalid or missing token
 * @response {404} User not found
 * @response {500} Failed to get profile
 */
async function getProfile(req, res) {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
      },
    });
  } catch (error) {
    logger.error('Failed to get profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
    });
  }
}

module.exports = {
  register,
  login,
  getProfile,
};
