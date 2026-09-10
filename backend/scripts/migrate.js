#!/usr/bin/env node

/**
 * Database Migration CLI
 * Command-line interface for running database migrations
 */

const DatabaseMigrator = require('../src/storage/migrator');
const path = require('path');

// Get database path from environment or use default
const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'cscm_local.db');

// Create migrator instance
const migrator = new DatabaseMigrator(dbPath);

// Parse command
const command = process.argv[2];
const args = process.argv.slice(3);

async function main() {
  try {
    switch (command) {
      case 'migrate':
      case 'up':
        console.log('Running pending migrations...');
        const result = await migrator.migrate();
        
        if (result.success) {
          console.log(`✓ Successfully applied ${result.applied} migration(s)`);
          process.exit(0);
        } else {
          console.error(`✗ Migration failed: ${result.error}`);
          process.exit(1);
        }
        break;

      case 'rollback':
      case 'down':
        console.log('Rolling back last migration...');
        const rollbackResult = await migrator.rollback();
        
        if (rollbackResult.success) {
          console.log(`✓ Successfully rolled back ${rollbackResult.rolledBack} migration(s)`);
          process.exit(0);
        } else {
          console.error(`✗ Rollback failed: ${rollbackResult.error}`);
          process.exit(1);
        }
        break;

      case 'status':
        console.log('Migration status:');
        const statusResult = await migrator.status();
        
        if (statusResult.success) {
          console.log(`\nApplied migrations (${statusResult.applied.length}):`);
          statusResult.applied.forEach(m => {
            console.log(`  - ${m.version}: ${m.name} (applied at ${m.applied_at})`);
          });
          
          console.log(`\nPending migrations (${statusResult.pending.length}):`);
          statusResult.pending.forEach(m => {
            console.log(`  - ${m.version}: ${m.name}`);
          });
          
          if (statusResult.pending.length === 0) {
            console.log('  (none)');
          }
          
          process.exit(0);
        } else {
          console.error(`✗ Failed to get status: ${statusResult.error}`);
          process.exit(1);
        }
        break;

      case 'create':
        if (args.length === 0) {
          console.error('Usage: migrate create <migration-name>');
          process.exit(1);
        }
        
        const migrationName = args.join('_');
        console.log(`Creating migration: ${migrationName}`);
        const filepath = migrator.createMigration(migrationName);
        console.log(`✓ Created migration file: ${filepath}`);
        process.exit(0);
        break;

      default:
        console.log('Database Migration CLI');
        console.log('');
        console.log('Usage:');
        console.log('  migrate           - Run pending migrations');
        console.log('  migrate up       - Run pending migrations');
        console.log('  migrate rollback  - Rollback last migration');
        console.log('  migrate down      - Rollback last migration');
        console.log('  migrate status    - Show migration status');
        console.log('  migrate create <name> - Create new migration file');
        console.log('');
        console.log('Environment variables:');
        console.log('  DB_PATH - Path to database file (default: ./data/cscm_local.db)');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration CLI error:', error);
    process.exit(1);
  }
}

main();
