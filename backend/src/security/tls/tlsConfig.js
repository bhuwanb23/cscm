/**
 * TLS Configuration Module
 * Provides TLS 1.3 configuration and certificate management
 */

const fs = require('fs');
const path = require('path');
const logger = require('../../utils/logger');

class TLSConfig {
  constructor(options = {}) {
    this.tlsVersion = options.tlsVersion || 'TLSv1.3';
    this.minVersion = options.minVersion || 'TLSv1.2';
    this.ciphers = options.ciphers || this.getDefaultCiphers();
    this.honorCipherOrder = options.honorCipherOrder !== false;
    this.rejectUnauthorized = options.rejectUnauthorized !== false;
    this.certPath = options.certPath;
    this.keyPath = options.keyPath;
    this.caPath = options.caPath;
  }

  /**
   * Get default secure cipher suites
   */
  getDefaultCiphers() {
    // TLS 1.3 compatible cipher suites
    return [
      'TLS_AES_256_GCM_SHA384',
      'TLS_CHACHA20_POLY1305_SHA256',
      'TLS_AES_128_GCM_SHA256'
    ].join(':');
  }

  /**
   * Get TLS options for Node.js https server
   */
  getTLSOptions() {
    const tlsOptions = {
      minVersion: this.minVersion,
      ciphers: this.ciphers,
      honorCipherOrder: this.honorCipherOrder,
      rejectUnauthorized: this.rejectUnauthorized
    };

    // Add certificate and key if provided
    if (this.certPath && this.keyPath) {
      try {
        tlsOptions.cert = fs.readFileSync(this.certPath);
        tlsOptions.key = fs.readFileSync(this.keyPath);
        logger.info('TLS certificate and key loaded');
      } catch (error) {
        logger.error('Failed to load TLS certificate or key:', error);
        throw new Error('Failed to load TLS certificate or key');
      }
    }

    // Add CA certificate if provided
    if (this.caPath) {
      try {
        tlsOptions.ca = fs.readFileSync(this.caPath);
        logger.info('TLS CA certificate loaded');
      } catch (error) {
        logger.error('Failed to load TLS CA certificate:', error);
      }
    }

    return tlsOptions;
  }

  /**
   * Validate TLS configuration
   */
  validateConfig() {
    const errors = [];

    if (this.certPath && !fs.existsSync(this.certPath)) {
      errors.push(`Certificate file not found: ${this.certPath}`);
    }

    if (this.keyPath && !fs.existsSync(this.keyPath)) {
      errors.push(`Key file not found: ${this.keyPath}`);
    }

    if (this.caPath && !fs.existsSync(this.caPath)) {
      errors.push(`CA file not found: ${this.caPath}`);
    }

    if (errors.length > 0) {
      throw new Error(`TLS configuration validation failed: ${errors.join(', ')}`);
    }

    logger.info('TLS configuration validated successfully');
    return true;
  }

  /**
   * Check if TLS is properly configured
   */
  isConfigured() {
    return this.certPath && this.keyPath && 
           fs.existsSync(this.certPath) && 
           fs.existsSync(this.keyPath);
  }

  /**
   * Get security headers for TLS
   */
  getSecurityHeaders() {
    return {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }

  /**
   * Generate self-signed certificate for development
   */
  static generateSelfSignedCert(outputDir, commonName = 'localhost') {
    const { execSync } = require('child_process');
    
    try {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const keyPath = path.join(outputDir, 'key.pem');
      const certPath = path.join(outputDir, 'cert.pem');

      // Generate private key
      execSync(`openssl genrsa -out ${keyPath} 2048`);
      
      // Generate self-signed certificate
      execSync(
        `openssl req -new -x509 -key ${keyPath} -out ${certPath} -days 365 -subj "/CN=${commonName}"`
      );

      logger.info('Self-signed certificate generated successfully');
      
      return {
        keyPath,
        certPath
      };
    } catch (error) {
      logger.error('Failed to generate self-signed certificate:', error);
      throw new Error('Failed to generate self-signed certificate');
    }
  }
}

/**
 * Create TLS configuration for different environments
 */
function createTLSConfig(environment = 'production') {
  const configs = {
    development: {
      tlsVersion: 'TLSv1.3',
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false, // Allow self-signed certs in development
      certPath: process.env.TLS_CERT_PATH,
      keyPath: process.env.TLS_KEY_PATH,
      caPath: process.env.TLS_CA_PATH
    },
    staging: {
      tlsVersion: 'TLSv1.3',
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
      certPath: process.env.TLS_CERT_PATH,
      keyPath: process.env.TLS_KEY_PATH,
      caPath: process.env.TLS_CA_PATH
    },
    production: {
      tlsVersion: 'TLSv1.3',
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
      honorCipherOrder: true,
      certPath: process.env.TLS_CERT_PATH,
      keyPath: process.env.TLS_KEY_PATH,
      caPath: process.env.TLS_CA_PATH
    }
  };

  return new TLSConfig(configs[environment] || configs.production);
}

module.exports = {
  TLSConfig,
  createTLSConfig
};
