/**
 * Database Backup System
 * Provides automated backup and restore functionality for SQLite databases
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const logger = require('../utils/logger');

class DatabaseBackup {
  constructor(dbPath, backupDir = null) {
    this.dbPath = dbPath;
    this.backupDir = backupDir || path.join(path.dirname(dbPath), 'backups');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info('Created backup directory');
    }
  }

  /**
   * Generate backup filename with timestamp
   */
  generateBackupFilename() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');
    const dbName = path.basename(this.dbPath, '.db');
    return `${dbName}_backup_${timestamp}.db`;
  }

  /**
   * Create a backup of the database
   */
  async createBackup() {
    try {
      const backupFilename = this.generateBackupFilename();
      const backupPath = path.join(this.backupDir, backupFilename);

      // Copy database file to backup location
      fs.copyFileSync(this.dbPath, backupPath);
      
      // Verify backup was created
      if (!fs.existsSync(backupPath)) {
        throw new Error('Backup file was not created');
      }

      // Get file size for verification
      const originalSize = fs.statSync(this.dbPath).size;
      const backupSize = fs.statSync(backupPath).size;

      if (originalSize !== backupSize) {
        logger.warn(`Backup size mismatch: original=${originalSize}, backup=${backupSize}`);
      }

      logger.info(`Database backup created: ${backupFilename}`);
      
      return {
        success: true,
        backupPath,
        filename: backupFilename,
        size: backupSize,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Failed to create backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Restore database from backup
   */
  async restoreBackup(backupFilename) {
    try {
      const backupPath = path.join(this.backupDir, backupFilename);

      // Verify backup exists
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFilename}`);
      }

      // Create a temporary backup of current database before restore
      const tempBackup = this.generateBackupFilename();
      const tempBackupPath = path.join(this.backupDir, tempBackup);
      fs.copyFileSync(this.dbPath, tempBackupPath);

      try {
        // Restore from backup
        fs.copyFileSync(backupPath, this.dbPath);

        logger.info(`Database restored from backup: ${backupFilename}`);
        
        return {
          success: true,
          backupPath,
          filename: backupFilename,
          tempBackup: tempBackup,
          timestamp: new Date().toISOString()
        };
      } catch (restoreError) {
        // If restore fails, restore the temporary backup
        fs.copyFileSync(tempBackupPath, this.dbPath);
        throw restoreError;
      }
    } catch (error) {
      logger.error('Failed to restore backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List all available backups
   */
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.db'))
        .map(file => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
        .sort((a, b) => b.created - a.created); // Sort by creation date, newest first

      return {
        success: true,
        backups: files,
        count: files.length
      };
    } catch (error) {
      logger.error('Failed to list backups:', error);
      return {
        success: false,
        error: error.message,
        backups: []
      };
    }
  }

  /**
   * Delete old backups based on retention policy
   */
  async rotateBackups(maxBackups = 10, maxAgeDays = 30) {
    try {
      const result = this.listBackups();
      
      if (!result.success) {
        return result;
      }

      const backups = result.backups;
      const deletedBackups = [];
      const now = new Date();
      const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds

      // Delete backups older than maxAgeDays
      for (const backup of backups) {
        const age = now - backup.created;
        if (age > maxAge) {
          fs.unlinkSync(backup.path);
          deletedBackups.push({
            filename: backup.filename,
            reason: 'age_exceeded',
            age_days: Math.floor(age / (24 * 60 * 60 * 1000))
          });
          logger.info(`Deleted old backup: ${backup.filename} (age: ${Math.floor(age / (24 * 60 * 60 * 1000))} days)`);
        }
      }

      // Keep only the most recent maxBackups files
      const remainingBackups = this.listBackups().backups;
      if (remainingBackups.length > maxBackups) {
        const backupsToDelete = remainingBackups.slice(maxBackups);
        for (const backup of backupsToDelete) {
          fs.unlinkSync(backup.path);
          deletedBackups.push({
            filename: backup.filename,
            reason: 'count_exceeded'
          });
          logger.info(`Deleted excess backup: ${backup.filename}`);
        }
      }

      return {
        success: true,
        deleted: deletedBackups.length,
        deletedBackups
      };
    } catch (error) {
      logger.error('Failed to rotate backups:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(backupFilename) {
    try {
      const backupPath = path.join(this.backupDir, backupFilename);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFilename}`);
      }

      // Check file size
      const stats = fs.statSync(backupPath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      // Try to open the database and run a simple query
      const sqlite3 = require('sqlite3').verbose();
      
      return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(backupPath, (err) => {
          if (err) {
            reject(new Error('Backup file is not a valid SQLite database'));
            return;
          }

          // Run a simple query to verify database integrity
          db.get('SELECT count(*) as count FROM sqlite_master', [], (err, row) => {
            db.close();
            
            if (err) {
              reject(new Error('Backup database integrity check failed'));
            } else {
              resolve({
                success: true,
                valid: true,
                size: stats.size,
                tables: row.count
              });
            }
          });
        });
      });
    } catch (error) {
      logger.error('Backup validation failed:', error);
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Get backup statistics
   */
  getBackupStats() {
    try {
      const result = this.listBackups();
      
      if (!result.success) {
        return result;
      }

      const backups = result.backups;
      const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
      const oldestBackup = backups[backups.length - 1];
      const newestBackup = backups[0];

      return {
        success: true,
        count: backups.length,
        totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        oldest: oldestBackup ? oldestBackup.created : null,
        newest: newestBackup ? newestBackup.created : null
      };
    } catch (error) {
      logger.error('Failed to get backup stats:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DatabaseBackup;
