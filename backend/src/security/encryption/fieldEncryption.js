/**
 * Field-Level Encryption Module
 * Provides encryption for sensitive database fields using AES-256-GCM
 */

const crypto = require('crypto');
const logger = require('../../utils/logger');

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32, // 256 bits
  ivLength: 16, // 96 bits for GCM
  tagLength: 16, // 128 bits authentication tag
  saltLength: 32
};

/**
 * Derive encryption key from password using PBKDF2
 */
function deriveKey(password, salt) {
  return crypto.pbkdf2Sync(
    password,
    salt,
    100000, // iterations
    ENCRYPTION_CONFIG.keyLength,
    'sha256'
  );
}

/**
 * Generate random IV for encryption
 */
function generateIV() {
  return crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
}

/**
 * Generate random salt for key derivation
 */
function generateSalt() {
  return crypto.randomBytes(ENCRYPTION_CONFIG.saltLength);
}

/**
 * Encrypt a field value
 */
function encryptField(value, password) {
  if (!value) {
    return null;
  }

  try {
    const salt = generateSalt();
    const key = deriveKey(password, salt);
    const iv = generateIV();
    
    const cipher = crypto.createCipheriv(
      ENCRYPTION_CONFIG.algorithm,
      key,
      iv
    );
    
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine salt, iv, authTag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    // Return as base64 for storage
    return combined.toString('base64');
  } catch (error) {
    logger.error('Field encryption failed:', error);
    throw new Error('Field encryption failed');
  }
}

/**
 * Decrypt a field value
 */
function decryptField(encryptedValue, password) {
  if (!encryptedValue) {
    return null;
  }

  try {
    const combined = Buffer.from(encryptedValue, 'base64');
    
    // Extract components
    const salt = combined.slice(0, ENCRYPTION_CONFIG.saltLength);
    const iv = combined.slice(
      ENCRYPTION_CONFIG.saltLength,
      ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength
    );
    const authTag = combined.slice(
      ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength,
      ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength
    );
    const encrypted = combined.slice(
      ENCRYPTION_CONFIG.saltLength + ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength
    );
    
    const key = deriveKey(password, salt);
    
    const decipher = crypto.createDecipheriv(
      ENCRYPTION_CONFIG.algorithm,
      key,
      iv
    );
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    logger.error('Field decryption failed:', error);
    throw new Error('Field decryption failed');
  }
}

/**
 * Encrypt an object with specified sensitive fields
 */
function encryptObject(obj, sensitiveFields, password) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const encrypted = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.includes(key) && value) {
      encrypted[key] = encryptField(value, password);
    } else if (typeof value === 'object' && value !== null) {
      encrypted[key] = encryptObject(value, sensitiveFields, password);
    } else {
      encrypted[key] = value;
    }
  }

  return encrypted;
}

/**
 * Decrypt an object with specified sensitive fields
 */
function decryptObject(obj, sensitiveFields, password) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const decrypted = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (sensitiveFields.includes(key) && value) {
      try {
        decrypted[key] = decryptField(value, password);
      } catch (error) {
        // If decryption fails, keep original value
        decrypted[key] = value;
        logger.warn(`Failed to decrypt field ${key}, keeping original value`);
      }
    } else if (typeof value === 'object' && value !== null) {
      decrypted[key] = decryptObject(value, sensitiveFields, password);
    } else {
      decrypted[key] = value;
    }
  }

  return decrypted;
}

/**
 * Hash a value for comparison (one-way)
 */
function hashValue(value, salt = null) {
  if (!value) {
    return null;
  }

  const dataSalt = salt || generateSalt();
  const hash = crypto.pbkdf2Sync(
    value,
    dataSalt,
    100000,
    64,
    'sha512'
  );
  
  // Return salt and hash combined
  return Buffer.concat([dataSalt, hash]).toString('base64');
}

/**
 * Verify a value against a hash
 */
function verifyHash(value, hashedValue) {
  if (!value || !hashedValue) {
    return false;
  }

  try {
    const combined = Buffer.from(hashedValue, 'base64');
    const salt = combined.slice(0, ENCRYPTION_CONFIG.saltLength);
    const hash = combined.slice(ENCRYPTION_CONFIG.saltLength);
    
    const computedHash = crypto.pbkdf2Sync(
      value,
      salt,
      100000,
      64,
      'sha512'
    );
    
    return crypto.timingSafeEqual(hash, computedHash);
  } catch (error) {
    logger.error('Hash verification failed:', error);
    return false;
  }
}

/**
 * Check if a value is encrypted
 */
function isEncrypted(value) {
  if (!value || typeof value !== 'string') {
    return false;
  }

  try {
    const decoded = Buffer.from(value, 'base64');
    // Check if it has the expected structure
    return decoded.length === (
      ENCRYPTION_CONFIG.saltLength + 
      ENCRYPTION_CONFIG.ivLength + 
      ENCRYPTION_CONFIG.tagLength + 
      16 // minimum encrypted data length
    );
  } catch (error) {
    return false;
  }
}

module.exports = {
  encryptField,
  decryptField,
  encryptObject,
  decryptObject,
  hashValue,
  verifyHash,
  isEncrypted,
  generateSalt,
  generateIV,
  ENCRYPTION_CONFIG
};
