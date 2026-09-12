/**
 * Password validation utility
 * Enforces strong password policies as per security best practices
 */

// Common weak passwords blacklist
const COMMON_PASSWORDS = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'password1',
  'admin', 'welcome', 'login', 'monkey', 'dragon', 'master',
  'letmein', 'shadow', 'sunshine', 'princess', 'football'
];

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and errors array
 */
function validatePassword(password) {
  const errors = [];

  // Check minimum length (12 characters)
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  // Check for uppercase letters
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  // Check for lowercase letters
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  // Check for numbers
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  // Check for special characters
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a stronger password.');
  }

  // Check for sequential or repeated characters
  if (isSequentialOrRepeated(password)) {
    errors.push('Password contains sequential or repeated characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if password contains sequential or repeated characters
 * @param {string} password - Password to check
 * @returns {boolean} True if contains sequential or repeated characters
 */
function isSequentialOrRepeated(password) {
  const lowerPassword = password.toLowerCase();
  
  // Check for sequential characters (e.g., "123", "abc")
  for (let i = 0; i < lowerPassword.length - 2; i++) {
    const charCode = lowerPassword.charCodeAt(i);
    const nextCharCode = lowerPassword.charCodeAt(i + 1);
    const nextNextCharCode = lowerPassword.charCodeAt(i + 2);
    
    // Check ascending sequence
    if (charCode + 1 === nextCharCode && nextCharCode + 1 === nextNextCharCode) {
      return true;
    }
    
    // Check descending sequence
    if (charCode - 1 === nextCharCode && nextCharCode - 1 === nextNextCharCode) {
      return true;
    }
  }

  // Check for repeated characters (e.g., "aaa", "111")
  for (let i = 0; i < lowerPassword.length - 2; i++) {
    if (lowerPassword[i] === lowerPassword[i + 1] && lowerPassword[i + 1] === lowerPassword[i + 2]) {
      return true;
    }
  }

  return false;
}

module.exports = {
  validatePassword
};
