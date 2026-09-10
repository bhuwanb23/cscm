# PostgreSQL Migration Guide

## Overview

This guide provides step-by-step instructions for migrating the CSCM system from SQLite to PostgreSQL.

## Prerequisites

### Software Requirements
- PostgreSQL 14+ (recommended: PostgreSQL 15)
- Node.js with pg package
- pgBouncer (optional, for connection pooling)
- PostgreSQL client tools (psql, pg_dump, pg_restore)

### Hardware Requirements
- **Minimum**: 2 CPU cores, 4GB RAM, 20GB storage
- **Recommended**: 4 CPU cores, 8GB RAM, 50GB storage
- **Production**: 8+ CPU cores, 16GB+ RAM, 100GB+ SSD storage

## Installation

### PostgreSQL Installation

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Windows
Download and install from [PostgreSQL Official Site](https://www.postgresql.org/download/windows/)

### pgBouncer Installation
```bash
# Ubuntu/Debian
sudo apt install pgbouncer

# macOS
brew install pgbouncer

# Configure pgBouncer
sudo nano /etc/pgbouncer/pgbouncer.ini
```

## Schema Migration

### Step 1: Analyze Current Schema

```bash
# Use SQLite CLI to export schema
sqlite3 data/cscm_local.db .schema > sqlite_schema.sql
```

### Step 2: Convert Schema to PostgreSQL

#### Automatic Conversion
```bash
# Use online converter or manual conversion
# Key changes needed:
# - INTEGER PRIMARY KEY AUTOINCREMENT -> SERIAL PRIMARY KEY
# - DATETIME -> TIMESTAMP
# - Adjust index syntax if needed
```

#### Manual Conversion Example
```sql
-- SQLite Schema
CREATE TABLE inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, store_id)
);

-- PostgreSQL Schema
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, store_id)
);
```

### Step 3: Create PostgreSQL Database

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database
CREATE DATABASE cscm_production;

# Create user
CREATE USER cscm_user WITH PASSWORD 'secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE cscm_production TO cscm_user;
```

### Step 4: Apply Schema

```bash
# Apply converted schema
psql -U cscm_user -d cscm_production -f postgresql_schema.sql
```

## Data Migration

### Step 1: Export Data from SQLite

```bash
# Export each table to CSV
sqlite3 data/cscm_local.db <<EOF
.headers on
.mode csv
.output inventory.csv
SELECT * FROM inventory;
.output orders.csv
SELECT * FROM orders;
.output shipments.csv
SELECT * FROM shipments;
.output events.csv
SELECT * FROM events;
.quit
EOF
```

### Step 2: Import Data to PostgreSQL

```bash
# Import CSV files
psql -U cscm_user -d cscm_production <<EOF
\copy inventory FROM 'inventory.csv' CSV HEADER
\copy orders FROM 'orders.csv' CSV HEADER
\copy shipments FROM 'shipments.csv' CSV HEADER
\copy events FROM 'events.csv' CSV HEADER
EOF
```

### Step 3: Validate Data Integrity

```sql
-- Check row counts
SELECT 'inventory' as table_name, COUNT(*) as row_count FROM inventory
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'shipments', COUNT(*) FROM shipments
UNION ALL
SELECT 'events', COUNT(*) FROM events;

-- Check foreign key constraints
SELECT COUNT(*) FROM orders o
LEFT JOIN inventory i ON o.store_id = i.store_id
WHERE i.store_id IS NULL;
```

## Application Configuration

### Step 1: Install PostgreSQL Driver

```bash
cd backend
npm install pg
```

### Step 2: Update Database Configuration

#### Environment Variables
```bash
# .env file
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=cscm_production
DB_USER=cscm_user
DB_PASSWORD=secure_password
DB_POOL_MIN=2
DB_POOL_MAX=20
```

#### Database Connection Code
```javascript
// src/storage/postgresqlDatabase.js
const { Pool } = require('pg');

class PostgreSQLDatabase {
  constructor() {
    this.pool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async initialize() {
    try {
      // Test connection
      const client = await this.pool.connect();
      client.release();
      console.log('PostgreSQL connection established');
      
      // Create tables if needed
      await this.createTables();
      await this.createIndexes();
      
      console.log('PostgreSQL database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PostgreSQL database:', error);
      throw error;
    }
  }

  async query(sql, params = []) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createTables() {
    // Table creation code here
  }

  async createIndexes() {
    // Index creation code here
  }

  async close() {
    await this.pool.end();
  }
}

module.exports = PostgreSQLDatabase;
```

### Step 3: Update Application Code

#### Replace SQLite-specific code
```javascript
// Old (SQLite)
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/cscm_local.db');

// New (PostgreSQL)
const PostgreSQLDatabase = require('./storage/postgresqlDatabase');
const db = new PostgreSQLDatabase();
await db.initialize();
```

#### Update query syntax
```javascript
// Old (SQLite)
db.all('SELECT * FROM inventory WHERE store_id = ?', [storeId], (err, rows) => {
  if (err) console.error(err);
  console.log(rows);
});

// New (PostgreSQL)
const rows = await db.query('SELECT * FROM inventory WHERE store_id = $1', [storeId]);
console.log(rows);
```

## Migration Scripts

### Automated Migration Script

```javascript
// scripts/migrate-to-postgresql.js
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const fs = require('fs');

async function migrateToPostgreSQL() {
  // Connect to SQLite
  const sqliteDb = new sqlite3.Database('./data/cscm_local.db');
  
  // Connect to PostgreSQL
  const pgPool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    // Migrate each table
    await migrateTable(sqliteDb, pgPool, 'inventory');
    await migrateTable(sqliteDb, pgPool, 'orders');
    await migrateTable(sqliteDb, pgPool, 'shipments');
    await migrateTable(sqliteDb, pgPool, 'events');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

async function migrateTable(sqliteDb, pgPool, tableName) {
  console.log(`Migrating table: ${tableName}`);
  
  // Get data from SQLite
  const rows = await new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  if (rows.length === 0) {
    console.log(`  No data to migrate for ${tableName}`);
    return;
  }

  // Get column names
  const columns = Object.keys(rows[0]);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const columnNames = columns.join(', ');

  // Insert into PostgreSQL
  const client = await pgPool.connect();
  try {
    for (const row of rows) {
      const values = columns.map(col => row[col]);
      const query = `INSERT INTO ${tableName} (${columnNames}) VALUES (${placeholders})`;
      await client.query(query, values);
    }
    console.log(`  Migrated ${rows.length} rows from ${tableName}`);
  } finally {
    client.release();
  }
}

migrateToPostgreSQL();
```

## Testing

### Unit Tests
```javascript
// tests/database/postgresql.test.js
const PostgreSQLDatabase = require('../../src/storage/postgresqlDatabase');

describe('PostgreSQL Database', () => {
  let db;

  beforeAll(async () => {
    db = new PostgreSQLDatabase();
    await db.initialize();
  });

  afterAll(async () => {
    await db.close();
  });

  test('should connect to database', async () => {
    const result = await db.query('SELECT NOW()');
    expect(result.length).toBe(1);
  });

  test('should perform CRUD operations', async () => {
    // Create
    await db.query('INSERT INTO inventory (product_id, store_id, quantity) VALUES ($1, $2, $3)', 
      ['PROD1', 'STORE1', 100]);
    
    // Read
    const rows = await db.query('SELECT * FROM inventory WHERE product_id = $1', ['PROD1']);
    expect(rows.length).toBe(1);
    
    // Update
    await db.query('UPDATE inventory SET quantity = $1 WHERE product_id = $2', [150, 'PROD1']);
    
    // Delete
    await db.query('DELETE FROM inventory WHERE product_id = $1', ['PROD1']);
  });
});
```

### Integration Tests
```bash
# Run integration tests with PostgreSQL
npm run test:integration
```

### Performance Tests
```bash
# Compare performance between SQLite and PostgreSQL
npm run test:performance
```

## Deployment

### Docker Deployment

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: cscm_production
      POSTGRES_USER: cscm_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U cscm_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_DBNAME: cscm_production
      DATABASES_USER: cscm_user
      DATABASES_PASSWORD: secure_password
    ports:
      - "6432:6432"
    depends_on:
      postgres:
        condition: service_healthy

  backend:
    build: ./backend
    environment:
      DB_TYPE: postgresql
      DB_HOST: pgbouncer
      DB_PORT: 6432
      DB_NAME: cscm_production
      DB_USER: cscm_user
      DB_PASSWORD: secure_password
    depends_on:
      - pgbouncer

volumes:
  postgres_data:
```

### Kubernetes Deployment

#### ConfigMap
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
data:
  POSTGRES_DB: cscm_production
  POSTGRES_USER: cscm_user
```

#### Secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
type: Opaque
data:
  POSTGRES_PASSWORD: c2VjdXJlX3Bhc3N3b3Jk  # base64 encoded
```

#### Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        envFrom:
        - configMapRef:
            name: postgres-config
        - secretRef:
            name: postgres-secret
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-pvc
```

## Backup and Recovery

### PostgreSQL Backup
```bash
# Logical backup
pg_dump -U cscm_user -d cscm_production > backup.sql

# Custom format backup
pg_dump -U cscm_user -d cscm_production -Fc > backup.dump

# Physical backup
pg_basebackup -U cscm_user -D /path/to/backup -Ft -P
```

### PostgreSQL Restore
```bash
# Restore from SQL dump
psql -U cscm_user -d cscm_production < backup.sql

# Restore from custom format
pg_restore -U cscm_user -d cscm_production backup.dump
```

## Monitoring

### Query Performance
```sql
-- Enable pg_stat_statements
CREATE EXTENSION pg_stat_statements;

-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Connection Monitoring
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Check connection pool status
SHOW pool_size;
SHOW pool_available;
```

## Troubleshooting

### Common Issues

#### Connection Errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U cscm_user -d cscm_production -h localhost

# Check pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
```

#### Performance Issues
```sql
-- Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Kill long-running query
SELECT pg_terminate_backend(pid);
```

#### Migration Errors
```bash
# Check data types
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory';

# Check constraints
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'inventory';
```

## Rollback Plan

### Emergency Rollback
```bash
# Stop application
npm stop

# Restore SQLite backup
cp data/cscm_local.db.backup data/cscm_local.db

# Update configuration
# Set DB_TYPE=sqlite

# Restart application
npm start
```

### Partial Rollback
```bash
# Restore specific table from backup
psql -U cscm_user -d cscm_production -f inventory_backup.sql
```

## Post-Migration Tasks

### Performance Optimization
- [ ] Analyze query performance
- [ ] Add missing indexes
- [ ] Optimize slow queries
- [ ] Configure connection pooling
- [ ] Set up monitoring

### Security Hardening
- [ ] Enable SSL/TLS
- [ ] Configure pg_hba.conf
- [ ] Set up row-level security
- [ ] Configure audit logging
- [ ] Update firewall rules

### Documentation
- [ ] Update deployment documentation
- [ ] Document backup procedures
- [ ] Create runbooks for common issues
- [ ] Train team on PostgreSQL administration
- [ ] Update disaster recovery procedures

## Support Resources

### Documentation
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg Documentation](https://node-postgres.com/)
- [pgBouncer Documentation](https://www.pgbouncer.org/usage.html)

### Community
- [PostgreSQL Mailing Lists](https://www.postgresql.org/list/)
- [Stack Overflow PostgreSQL Tag](https://stackoverflow.com/questions/tagged/postgresql)
- [Reddit r/PostgreSQL](https://www.reddit.com/r/PostgreSQL/)

### Professional Support
- [EnterpriseDB](https://www.enterprisedb.com/)
- [Percona](https://www.percona.com/)
- [2ndQuadrant](https://www.2ndquadrant.com/)
