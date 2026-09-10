#!/usr/bin/env node

/**
 * Database Backup CLI
 * Command-line interface for database backup operations
 */

const DatabaseBackup = require('../src/storage/backup');
const path = require('path');

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cscm_local.db');
const backupDir = process.env.BACKUP_DIR || path.join(path.dirname(dbPath), 'backups');

// Create backup instance
const backup = new DatabaseBackup(dbPath, backupDir);

// Parse command
const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'create':
      case 'backup':
        console.log('Creating database backup...');
        const result = await backup.createBackup();
        
        if (result.success) {
          console.log(`✓ Backup created successfully`);
          console.log(`  File: ${result.filename}`);
          console.log(`  Size: ${(result.size / 1024).toFixed(2)} KB`);
          console.log(`  Path: ${result.backupPath}`);
          process.exit(0);
        } else {
          console.error(`✗ Backup failed: ${result.error}`);
          process.exit(1);
        }
        break;

      case 'restore':
        if (args.length === 0) {
          console.error('Usage: backup restore <backup-filename>');
          process.exit(1);
        }
        
        const backupFilename = args[0];
        console.log(`Restoring database from backup: ${backupFilename}`);
        const restoreResult = await backup.restoreBackup(backupFilename);
        
        if (restoreResult.success) {
          console.log(`✓ Database restored successfully`);
          console.log(`  From: ${backupFilename}`);
          console.log(`  Temp backup: ${restoreResult.tempBackup}`);
          process.exit(0);
        } else {
          console.error(`✗ Restore failed: ${restoreResult.error}`);
          process.exit(1);
        }
        break;

      case 'list':
      case 'ls':
        console.log('Available backups:');
        const listResult = backup.listBackups();
        
        if (listResult.success) {
          if (listResult.backups.length === 0) {
            console.log('  No backups found');
          } else {
            listResult.backups.forEach((backup, index) => {
              const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);
              const date = backup.created.toISOString();
              console.log(`  ${index + 1}. ${backup.filename}`);
              console.log(`     Size: ${sizeMB} MB`);
              console.log(`     Created: ${date}`);
            });
          }
          console.log(`\nTotal: ${listResult.count} backup(s)`);
          process.exit(0);
        } else {
          console.error(`✗ Failed to list backups: ${listResult.error}`);
          process.exit(1);
        }
        break;

      case 'rotate':
        const maxBackups = parseInt(args[0]) || 10;
        const maxAgeDays = parseInt(args[1]) || 30;
        
        console.log(`Rotating backups (max: ${maxBackups}, age: ${maxAgeDays} days)`);
        const rotateResult = await backup.rotateBackups(maxBackups, maxAgeDays);
        
        if (rotateResult.success) {
          console.log(`✓ Backup rotation completed`);
          console.log(`  Deleted: ${rotateResult.deleted} backup(s)`);
          if (rotateResult.deletedBackups.length > 0) {
            console.log('  Deleted files:');
            rotateResult.deletedBackups.forEach(deleted => {
              console.log(`    - ${deleted.filename} (${deleted.reason})`);
            });
          }
          process.exit(0);
        } else {
          console.error(`✗ Rotation failed: ${rotateResult.error}`);
          process.exit(1);
        }
        break;

      case 'validate':
        if (args.length === 0) {
          console.error('Usage: backup validate <backup-filename>');
          process.exit(1);
        }
        
        const validateFilename = args[0];
        console.log(`Validating backup: ${validateFilename}`);
        const validateResult = await backup.validateBackup(validateFilename);
        
        if (validateResult.success) {
          console.log(`✓ Backup is valid`);
          console.log(`  Size: ${(validateResult.size / 1024).toFixed(2)} KB`);
          console.log(`  Tables: ${validateResult.tables}`);
          process.exit(0);
        } else {
          console.error(`✗ Validation failed: ${validateResult.error}`);
          process.exit(1);
        }
        break;

      case 'stats':
        console.log('Backup statistics:');
        const statsResult = backup.getBackupStats();
        
        if (statsResult.success) {
          console.log(`  Total backups: ${statsResult.count}`);
          console.log(`  Total size: ${statsResult.totalSizeMB} MB`);
          if (statsResult.oldest) {
            console.log(`  Oldest: ${statsResult.oldest.toISOString()}`);
          }
          if (statsResult.newest) {
            console.log(`  Newest: ${statsResult.newest.toISOString()}`);
          }
          process.exit(0);
        } else {
          console.error(`✗ Failed to get stats: ${statsResult.error}`);
          process.exit(1);
        }
        break;

      default:
        console.log('Database Backup CLI');
        console.log('');
        console.log('Usage:');
        console.log('  backup create           - Create a new backup');
        console.log('  backup backup           - Create a new backup');
        console.log('  backup restore <file>   - Restore from backup file');
        console.log('  backup list             - List all backups');
        console.log('  backup ls               - List all backups');
        console.log('  backup rotate [max] [age] - Rotate old backups');
        console.log('  backup validate <file>  - Validate backup integrity');
        console.log('  backup stats            - Show backup statistics');
        console.log('');
        console.log('Environment variables:');
        console.log('  DB_PATH - Path to database file (default: ./data/cscm_local.db)');
        console.log('  BACKUP_DIR - Path to backup directory (default: ./data/backups)');
        process.exit(1);
    }
  } catch (error) {
    console.error('Backup CLI error:', error);
    process.exit(1);
  }
}

main();
