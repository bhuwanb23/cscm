/**
 * Key Management System
 * Provides secure key generation, storage, rotation, and lifecycle management
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

class KeyManager {
  constructor(keyStorePath = null) {
    this.keyStorePath = keyStorePath || path.join(process.cwd(), '.keys', 'keystore.json');
    this.keyStore = {};
    this.encryptionPassword = process.env.KEY_MANAGER_PASSWORD || 'default-key-manager-password';
    this.ensureKeyStoreDirectory();
    this.loadKeyStore();
  }

  /**
   * Ensure key store directory exists
   */
  ensureKeyStoreDirectory() {
    const keyDir = path.dirname(this.keyStorePath);
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
      logger.info('Created key store directory');
    }
  }

  /**
   * Load key store from disk
   */
  loadKeyStore() {
    try {
      if (fs.existsSync(this.keyStorePath)) {
        const encryptedData = fs.readFileSync(this.keyStorePath, 'utf8');
        this.keyStore = this.decryptKeyStore(encryptedData);
        logger.info('Key store loaded successfully');
      } else {
        this.keyStore = {};
        this.saveKeyStore();
        logger.info('Created new key store');
      }
    } catch (error) {
      logger.error('Failed to load key store:', error);
      this.keyStore = {};
    }
  }

  /**
   * Save key store to disk
   */
  saveKeyStore() {
    try {
      const encryptedData = this.encryptKeyStore(this.keyStore);
      fs.writeFileSync(this.keyStorePath, encryptedData, 'utf8');
      logger.info('Key store saved successfully');
    } catch (error) {
      logger.error('Failed to save key store:', error);
      throw error;
    }
  }

  /**
   * Encrypt key store for storage
   */
  encryptKeyStore(keyStore) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      this.encryptionPassword,
      'key-manager-salt',
      32
    );
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(JSON.stringify(keyStore), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, 'hex')]);
    return combined.toString('base64');
  }

  /**
   * Decrypt key store from storage
   */
  decryptKeyStore(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(
      this.encryptionPassword,
      'key-manager-salt',
      32
    );
    
    const combined = Buffer.from(encryptedData, 'base64');
    const iv = combined.slice(0, 16);
    const authTag = combined.slice(16, 32);
    const encrypted = combined.slice(32);
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  /**
   * Generate a new encryption key
   */
  generateKey(keyId, keyType = 'aes-256') {
    const keyConfig = {
      keyId,
      keyType,
      key: crypto.randomBytes(32).toString('base64'),
      createdAt: new Date().toISOString(),
      expiresAt: null,
      status: 'active',
      version: 1
    };

    this.keyStore[keyId] = keyConfig;
    this.saveKeyStore();
    
    logger.info(`Generated new key: ${keyId}`);
    return keyConfig;
  }

  /**
   * Get an encryption key
   */
  getKey(keyId) {
    const keyConfig = this.keyStore[keyId];
    
    if (!keyConfig) {
      logger.warn(`Key not found: ${keyId}`);
      return null;
    }

    // Check if key is expired
    if (keyConfig.expiresAt && new Date(keyConfig.expiresAt) < new Date()) {
      logger.warn(`Key expired: ${keyId}`);
      return null;
    }

    return keyConfig;
  }

  /**
   * Rotate an encryption key
   */
  rotateKey(keyId) {
    const oldKeyConfig = this.keyStore[keyId];
    
    if (!oldKeyConfig) {
      throw new Error(`Key not found: ${keyId}`);
    }

    // Generate new key
    const newKeyConfig = {
      keyId,
      keyType: oldKeyConfig.keyType,
      key: crypto.randomBytes(32).toString('base64'),
      createdAt: new Date().toISOString(),
      expiresAt: null,
      status: 'active',
      version: oldKeyConfig.version + 1
    };

    // Archive old key
    const archiveKey = `${keyId}_v${oldKeyConfig.version}`;
    this.keyStore[archiveKey] = {
      ...oldKeyConfig,
      status: 'archived',
      archivedAt: new Date().toISOString()
    };

    // Set new key as active
    this.keyStore[keyId] = newKeyConfig;
    this.saveKeyStore();
    
    logger.info(`Rotated key: ${keyId} (version ${newKeyConfig.version})`);
    return newKeyConfig;
  }

  /**
   * Delete a key
   */
  deleteKey(keyId) {
    if (!this.keyStore[keyId]) {
      throw new Error(`Key not found: ${keyId}`);
    }

    delete this.keyStore[keyId];
    this.saveKeyStore();
    
    logger.info(`Deleted key: ${keyId}`);
  }

  /**
   * Set key expiration
   */
  setKeyExpiration(keyId, expiresInDays) {
    const keyConfig = this.keyStore[keyId];
    
    if (!keyConfig) {
      throw new Error(`Key not found: ${keyId}`);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    
    keyConfig.expiresAt = expiresAt.toISOString();
    this.saveKeyStore();
    
    logger.info(`Set expiration for key ${keyId}: ${expiresAt.toISOString()}`);
  }

  /**
   * Get all keys
   */
  getAllKeys() {
    return Object.keys(this.keyStore).map(keyId => ({
      keyId,
      ...this.keyStore[keyId],
      key: undefined // Don't return the actual key
    }));
  }

  /**
   * Get active keys only
   */
  getActiveKeys() {
    return this.getAllKeys().filter(key => key.status === 'active');
  }

  /**
   * Get expired keys
   */
  getExpiredKeys() {
    const now = new Date();
    return this.getAllKeys().filter(key => 
      key.expiresAt && new Date(key.expiresAt) < now
    );
  }

  /**
   * Revoke a key
   */
  revokeKey(keyId) {
    const keyConfig = this.keyStore[keyId];
    
    if (!keyConfig) {
      throw new Error(`Key not found: ${keyId}`);
    }

    keyConfig.status = 'revoked';
    keyConfig.revokedAt = new Date().toISOString();
    this.saveKeyStore();
    
    logger.info(`Revoked key: ${keyId}`);
  }

  /**
   * Schedule key rotation
   */
  scheduleRotation(keyId, rotationIntervalDays) {
    const keyConfig = this.keyStore[keyId];
    
    if (!keyConfig) {
      throw new Error(`Key not found: ${keyId}`);
    }

    const rotationDate = new Date();
    rotationDate.setDate(rotationDate.getDate() + rotationIntervalDays);
    
    keyConfig.nextRotation = rotationDate.toISOString();
    this.saveKeyStore();
    
    logger.info(`Scheduled rotation for key ${keyId}: ${rotationDate.toISOString()}`);
  }

  /**
   * Check for keys due for rotation
   */
  getKeysDueForRotation() {
    const now = new Date();
    return this.getAllKeys().filter(key => 
      key.nextRotation && new Date(key.nextRotation) <= now
    );
  }

  /**
   * Generate a key for a specific purpose
   */
  generatePurposeKey(purpose, expiresInDays = 90) {
    const keyId = `${purpose}_key`;
    const keyConfig = this.generateKey(keyId);
    
    if (expiresInDays) {
      this.setKeyExpiration(keyId, expiresInDays);
    }
    
    return keyConfig;
  }

  /**
   * Export key metadata (not the actual keys)
   */
  exportKeyMetadata() {
    return {
      keys: this.getAllKeys(),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  /**
   * Import key metadata
   */
  importKeyMetadata(metadata) {
    // This would be used for backup/restore of key metadata
    // Implementation depends on security requirements
    logger.warn('Key metadata import not implemented for security reasons');
  }
}

// Singleton instance
let keyManagerInstance = null;

/**
 * Get the singleton key manager instance
 */
function getKeyManager() {
  if (!keyManagerInstance) {
    keyManagerInstance = new KeyManager();
  }
  return keyManagerInstance;
}

module.exports = {
  KeyManager,
  getKeyManager
};
