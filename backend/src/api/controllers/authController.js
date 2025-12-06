const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config');
const logger = require('../../utils/logger');

/**
 * Controller for handling authentication operations
 */

/**
 * Generate a JWT token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      role: user.role 
    },
    config.auth.jwtSecret,
    { expiresIn: config.auth.jwtExpiration }
  );
}

/**
 * Register a new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function register(req, res) {
  try {
    const { username, email, password, role } = req.body;
    
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username, email, and password are required'
      });
    }
    
    // In a real implementation, you would:
    // 1. Check if user already exists
    // 2. Hash the password
    // 3. Save user to database
    
    // For demo purposes, we'll simulate a user object
    const user = {
      id: Date.now().toString(),
      username,
      email,
      role: role || 'user'
    };
    
    // Generate token
    const token = generateToken(user);
    
    logger.info(`User registered: ${username}`);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    logger.error('Registration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
}

/**
 * Login user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }
    
    // In a real implementation, you would:
    // 1. Find user in database
    // 2. Compare hashed passwords
    // 3. Generate token
    
    // For demo purposes, we'll simulate a user object
    const user = {
      id: Date.now().toString(),
      username,
      email: `${username}@example.com`,
      role: 'user'
    };
    
    // Generate token
    const token = generateToken(user);
    
    logger.info(`User logged in: ${username}`);
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login failed:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
}

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getProfile(req, res) {
  try {
    // User is attached to request by authentication middleware
    const user = req.user;
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
}

module.exports = {
  register,
  login,
  getProfile
};