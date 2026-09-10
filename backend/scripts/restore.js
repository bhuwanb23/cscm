#!/usr/bin/env node

/**
 * Database Restore CLI
 * Command-line interface for database restore operations
 */

const DatabaseBackup = require('../src/storage/backup');
const path = require('path');

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cscm_local.db');
const backupDir = process.env.BACKUP_DIR || path.join(path.dirname(dbPath), 'backups');

// Create backup instance
const backup = new DatabaseBackup(dbPath, backupDir);

// Parse command
const backupFilename = process.argv[2];

async function main() {
  try {
    if (!backupFilename) {
      console.error('Usage: restore <backup-filename>');
      console.error('');
      console.error('Available backups:');
      const listResult = backup.listBackups();
      if (listResult.success && listResult.backups.length > 0) {
        listResult.backups.forEach((backup, index) => {
          const sizeMB = (backup.size / (1024 * 1024)).toFixed(2);
          const date = backup.created.toISOString();
          console.log(`  ${index + 1}. ${backup.filename} (${sizeMB} MB, ${date})`);
        });
      } else {
        console.error('  No backups found');
      }
      process.exit(1);
    }

    console.log(`Restoring database from backup: ${backupFilename}`);
    console.log('⚠️  This will replace the current database');
    console.log('⚠️  A temporary backup will be created before restore');
    
    // Confirm restore
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Are you sure you want to continue? (yes/no): ', async (answer) => {
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('Restore cancelled');
        process.exit(0);
      }

      const result = await backup.restoreBackup(backupFilename);
      
      if (result.success) {
        console.log(`✓ Database restored successfully`);
        console.log(`  From: ${backupFilename}`);
        console.log(`  Temp backup: ${result.tempBackup}`);
        console.log('⚠️  To undo this restore, use: backup restore <temp-backup>');
        process.exit(0);
      } else {
        console.error(`✗ Restore failed: ${result.error}`);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Restore CLI error:', error);
    process.exit(1);
  }
}

main();
