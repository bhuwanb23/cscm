/**
 * Certificate Management Module
 * Handles certificate loading, validation, and rotation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../../utils/logger');

class CertificateManager {
  constructor(certDir = null) {
    this.certDir = certDir || path.join(process.cwd(), '.certificates');
    this.ensureCertDirectory();
  }

  /**
   * Ensure certificate directory exists
   */
  ensureCertDirectory() {
    if (!fs.existsSync(this.certDir)) {
      fs.mkdirSync(this.certDir, { recursive: true });
      logger.info('Created certificate directory');
    }
  }

  /**
   * Load certificate information
   */
  loadCertificateInfo(certPath) {
    try {
      const cert = fs.readFileSync(certPath, 'utf8');
      
      // Use OpenSSL to get certificate information
      const output = execSync(`openssl x509 -in ${certPath} -text -noout`, {
        encoding: 'utf8'
      });

      const info = this.parseCertificateInfo(output);
      info.path = certPath;
      
      return info;
    } catch (error) {
      logger.error('Failed to load certificate info:', error);
      throw new Error('Failed to load certificate info');
    }
  }

  /**
   * Parse certificate information from OpenSSL output
   */
  parseCertificateInfo(opensslOutput) {
    const info = {
      subject: '',
      issuer: '',
      notBefore: '',
      notAfter: '',
      san: []
    };

    const lines = opensslOutput.split('\n');
    let currentSection = '';

    for (const line of lines) {
      if (line.includes('Subject:')) {
        info.subject = line.split('Subject:')[1].trim();
      } else if (line.includes('Issuer:')) {
        info.issuer = line.split('Issuer:')[1].trim();
      } else if (line.includes('Not Before:')) {
        info.notBefore = line.split('Not Before:')[1].trim();
      } else if (line.includes('Not After :')) {
        info.notAfter = line.split('Not After :')[1].trim();
      } else if (line.includes('Subject Alternative Name')) {
        const sanLine = line.split('Subject Alternative Name:')[1].trim();
        info.san = sanLine.split(',').map(s => s.trim());
      }
    }

    return info;
  }

  /**
   * Check if certificate is expiring soon
   */
  checkExpiration(certPath, daysThreshold = 30) {
    try {
      const info = this.loadCertificateInfo(certPath);
      const notAfter = new Date(info.notAfter);
      const now = new Date();
      const daysUntilExpiration = Math.floor((notAfter - now) / (1000 * 60 * 60 * 24));

      return {
        isExpiring: daysUntilExpiration <= daysThreshold,
        daysUntilExpiration,
        notAfter: info.notAfter,
        isExpired: daysUntilExpiration < 0
      };
    } catch (error) {
      logger.error('Failed to check certificate expiration:', error);
      return {
        isExpiring: true,
        daysUntilExpiration: 0,
        notAfter: null,
        isExpired: true
      };
    }
  }

  /**
   * Generate certificate signing request (CSR)
   */
  generateCSR(keyPath, csrPath, commonName, subject = {}) {
    try {
      const subjectAltNames = subject.san || [];
      
      let subjectStr = `/CN=${commonName}`;
      if (subject.country) subjectStr += `/C=${subject.country}`;
      if (subject.state) subjectStr += `/ST=${subject.state}`;
      if (subject.locality) subjectStr += `/L=${subject.locality}`;
      if (subject.organization) subjectStr += `/O=${subject.organization}`;
      if (subject.organizationalUnit) subjectStr += `/OU=${subject.organizationalUnit}`;

      let command = `openssl req -new -key ${keyPath} -out ${csrPath} -subj "${subjectStr}"`;
      
      if (subjectAltNames.length > 0) {
        const sanConfig = subjectAltNames.map(s => `DNS:${s}`).join(',');
        command += ` -addext "subjectAltName=${sanConfig}"`;
      }

      execSync(command);
      
      logger.info(`CSR generated: ${csrPath}`);
      return { csrPath, subjectStr };
    } catch (error) {
      logger.error('Failed to generate CSR:', error);
      throw new Error('Failed to generate CSR');
    }
  }

  /**
   * Generate self-signed certificate
   */
  generateSelfSignedCert(commonName, validityDays = 365, subject = {}) {
    try {
      const keyPath = path.join(this.certDir, `${commonName}-key.pem`);
      const certPath = path.join(this.certDir, `${commonName}-cert.pem`);

      // Generate private key
      execSync(`openssl genrsa -out ${keyPath} 2048`);

      // Generate self-signed certificate
      let subjectStr = `/CN=${commonName}`;
      if (subject.country) subjectStr += `/C=${subject.country}`;
      if (subject.state) subjectStr += `/ST=${subject.state}`;
      if (subject.locality) subjectStr += `/L=${subject.locality}`;
      if (subject.organization) subjectStr += `/O=${subject.organization}`;
      if (subject.organizationalUnit) subjectStr += `/OU=${subject.organizationalUnit}`;

      const command = `openssl req -new -x509 -key ${keyPath} -out ${certPath} -days ${validityDays} -subj "${subjectStr}"`;
      execSync(command);

      logger.info(`Self-signed certificate generated: ${certPath}`);
      
      return {
        keyPath,
        certPath,
        validityDays,
        subject: subjectStr
      };
    } catch (error) {
      logger.error('Failed to generate self-signed certificate:', error);
      throw new Error('Failed to generate self-signed certificate');
    }
  }

  /**
   * Get all certificates in the directory
   */
  getAllCertificates() {
    try {
      const files = fs.readdirSync(this.certDir)
        .filter(file => file.endsWith('.pem') || file.endsWith('.crt'))
        .map(file => {
          const filePath = path.join(this.certDir, file);
          try {
            const info = this.loadCertificateInfo(filePath);
            return {
              file,
              path: filePath,
              info,
              expiration: this.checkExpiration(filePath)
            };
          } catch (error) {
            return {
              file,
              path: filePath,
              error: error.message
            };
          }
        });

      return files;
    } catch (error) {
      logger.error('Failed to list certificates:', error);
      return [];
    }
  }

  /**
   * Validate certificate chain
   */
  validateChain(certPath, caPath) {
    try {
      const command = `openssl verify -CAfile ${caPath} ${certPath}`;
      execSync(command);
      
      return {
        valid: true,
        message: 'Certificate chain is valid'
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Certificate chain validation failed',
        error: error.message
      };
    }
  }

  /**
   * Get certificate fingerprint
   */
  getFingerprint(certPath, algorithm = 'sha256') {
    try {
      const command = `openssl x509 -in ${certPath} -noout -fingerprint -${algorithm}`;
      const output = execSync(command, { encoding: 'utf8' });
      
      return output.trim().split('=')[1].replace(/:/g, '').toLowerCase();
    } catch (error) {
      logger.error('Failed to get certificate fingerprint:', error);
      throw new Error('Failed to get certificate fingerprint');
    }
  }

  /**
   * Archive old certificate
   */
  archiveCertificate(certPath) {
    try {
      const archiveDir = path.join(this.certDir, 'archive');
      if (!fs.existsSync(archiveDir)) {
        fs.mkdirSync(archiveDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = path.basename(certPath);
      const archivePath = path.join(archiveDir, `${timestamp}_${fileName}`);

      fs.copyFileSync(certPath, archivePath);
      
      logger.info(`Certificate archived: ${archivePath}`);
      return archivePath;
    } catch (error) {
      logger.error('Failed to archive certificate:', error);
      throw new Error('Failed to archive certificate');
    }
  }
}

module.exports = CertificateManager;
