/**
 * Database Migration System
 * Provides schema migration management with rollback capability
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DatabaseMigrator {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.ensureMigrationsDirectory();
  }

  /**
   * Ensure migrations directory exists
   */
  ensureMigrationsDirectory() {
    if (!fs.existsSync(this.migrationsPath)) {
      fs.mkdirSync(this.migrationsPath, { recursive: true });
      logger.info('Created migrations directory');
    }
  }

  /**
   * Initialize database connection
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Failed to open database for migration:', err);
          reject(err);
        } else {
          logger.info('Database connection established for migration');
          this.createMigrationTable().then(resolve).catch(reject);
        }
      });
    });
  }

  /**
   * Create migration tracking table
   */
  async createMigrationTable() {
    return new Promise((resolve, reject) => {
      const sql = `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          rollback_sql TEXT
        )
      `;
      
      this.db.run(sql, (err) => {
        if (err) {
          logger.error('Failed to create migration table:', err);
          reject(err);
        } else {
          logger.info('Migration table created or already exists');
          resolve();
        }
      });
    });
  }

  /**
   * Get applied migrations
   */
  async getAppliedMigrations() {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT version, name, applied_at FROM schema_migrations ORDER BY id ASC';
      
      this.db.all(sql, [], (err, rows) => {
        if (err) {
          logger.error('Failed to get applied migrations:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Get pending migrations
   */
  async getPendingMigrations() {
    const appliedMigrations = await this.getAppliedMigrations();
    const appliedVersions = new Set(appliedMigrations.map(m => m.version));
    
    const migrationFiles = fs.readdirSync(this.migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    const pendingMigrations = [];
    
    for (const file of migrationFiles) {
      const version = file.replace('.js', '');
      if (!appliedVersions.has(version)) {
        const migration = require(path.join(this.migrationsPath, file));
        pendingMigrations.push({
          version,
          name: migration.name || file,
          up: migration.up,
          down: migration.down
        });
      }
    }
    
    return pendingMigrations;
  }

  /**
   * Apply a single migration
   */
  async applyMigration(migration) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION', (err) => {
          if (err) {
            logger.error('Failed to begin transaction:', err);
            return reject(err);
          }
        });

        // Execute migration
        this.db.exec(migration.up, (err) => {
          if (err) {
            logger.error(`Failed to apply migration ${migration.version}:`, err);
            this.db.run('ROLLBACK');
            return reject(err);
          }

          // Record migration
          const sql = `
            INSERT INTO schema_migrations (version, name, rollback_sql)
            VALUES (?, ?, ?)
          `;
          
          this.db.run(sql, [migration.version, migration.name, migration.down || ''], (err) => {
            if (err) {
              logger.error(`Failed to record migration ${migration.version}:`, err);
              this.db.run('ROLLBACK');
              return reject(err);
            }

            this.db.run('COMMIT', (err) => {
              if (err) {
                logger.error('Failed to commit transaction:', err);
                this.db.run('ROLLBACK');
                return reject(err);
              }

              logger.info(`Applied migration ${migration.version}: ${migration.name}`);
              resolve();
            });
          });
        });
      });
    });
  }

  /**
   * Rollback a single migration
   */
  async rollbackMigration(version) {
    return new Promise((resolve, reject) => {
      // Get migration details
      const sql = 'SELECT version, name, rollback_sql FROM schema_migrations WHERE version = ?';
      
      this.db.get(sql, [version], (err, row) => {
        if (err) {
          logger.error('Failed to get migration details:', err);
          return reject(err);
        }
        
        if (!row) {
          logger.error(`Migration ${version} not found`);
          return reject(new Error(`Migration ${version} not found`));
        }

        if (!row.rollback_sql) {
          logger.error(`Migration ${version} does not have rollback SQL`);
          return reject(new Error(`Migration ${version} does not have rollback SQL`));
        }

        this.db.serialize(() => {
          this.db.run('BEGIN TRANSACTION', (err) => {
            if (err) {
              logger.error('Failed to begin transaction:', err);
              return reject(err);
            }
          });

          // Execute rollback
          this.db.exec(row.rollback_sql, (err) => {
            if (err) {
              logger.error(`Failed to rollback migration ${version}:`, err);
              this.db.run('ROLLBACK');
              return reject(err);
            }

            // Remove migration record
            const deleteSql = 'DELETE FROM schema_migrations WHERE version = ?';
            
            this.db.run(deleteSql, [version], (err) => {
              if (err) {
                logger.error(`Failed to remove migration record ${version}:`, err);
                this.db.run('ROLLBACK');
                return reject(err);
              }

              this.db.run('COMMIT', (err) => {
                if (err) {
                  logger.error('Failed to commit transaction:', err);
                  this.db.run('ROLLBACK');
                  return reject(err);
                }

                logger.info(`Rolled back migration ${version}: ${row.name}`);
                resolve();
              });
            });
          });
        });
      });
    });
  }

  /**
   * Run all pending migrations
   */
  async migrate() {
    try {
      await this.initialize();
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations to apply');
        return { success: true, applied: 0 };
      }

      logger.info(`Found ${pendingMigrations.length} pending migrations`);
      
      for (const migration of pendingMigrations) {
        await this.applyMigration(migration);
      }

      return { success: true, applied: pendingMigrations.length };
    } catch (error) {
      logger.error('Migration failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.close();
    }
  }

  /**
   * Rollback the last migration
   */
  async rollback() {
    try {
      await this.initialize();
      const appliedMigrations = await this.getAppliedMigrations();
      
      if (appliedMigrations.length === 0) {
        logger.info('No migrations to rollback');
        return { success: true, rolledBack: 0 };
      }

      const lastMigration = appliedMigrations[appliedMigrations.length - 1];
      await this.rollbackMigration(lastMigration.version);

      return { success: true, rolledBack: 1 };
    } catch (error) {
      logger.error('Rollback failed:', error);
      return { success: false, error: error.message };
    } finally {
      this.close();
    }
  }

  /**
   * Get migration status
   */
  async status() {
    try {
      await this.initialize();
      const appliedMigrations = await this.getAppliedMigrations();
      const pendingMigrations = await this.getPendingMigrations();
      
      return {
        success: true,
        applied: appliedMigrations,
        pending: pendingMigrations
      };
    } catch (error) {
      logger.error('Failed to get migration status:', error);
      return { success: false, error: error.message };
    } finally {
      this.close();
    }
  }

  /**
   * Create a new migration file
   */
  createMigration(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_');
    const version = `${timestamp}_${name}`;
    const filename = `${version}.js`;
    const filepath = path.join(this.migrationsPath, filename);
    
    const template = `/**
 * Migration: ${name}
 * Version: ${version}
 */

exports.name = '${name}';
exports.up = \`
  -- Add your migration SQL here
  -- Example: ALTER TABLE users ADD COLUMN email TEXT;
\`;

exports.down = \`
  -- Add your rollback SQL here
  -- Example: ALTER TABLE users DROP COLUMN email;
\`;
`;

    fs.writeFileSync(filepath, template);
    logger.info(`Created migration file: ${filename}`);
    
    return filepath;
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          logger.error('Error closing database:', err);
        } else {
          logger.info('Database connection closed');
        }
      });
      this.db = null;
    }
  }
}

module.exports = DatabaseMigrator;
