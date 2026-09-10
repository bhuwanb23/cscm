# Database Scaling Documentation

## Overview

This document outlines the database scaling strategy for the Cognitive Supply Chain Mesh (CSCM) system, including current SQLite limitations and migration paths to production-grade databases.

## Current Database: SQLite

### Purpose
SQLite is currently used for local development, prototyping, and demonstration purposes. It provides a simple, file-based database that requires no external server setup.

### SQLite Limitations

#### Performance Limitations
- **Single-Writer Architecture**: SQLite allows only one writer at a time, which can become a bottleneck under high write loads
- **Memory Usage**: The entire database is loaded into memory for write operations, limiting database size
- **No Network Access**: SQLite is embedded and cannot be accessed over the network, limiting deployment options
- **Concurrent Connection Limit**: Limited concurrent connections compared to client-server databases

#### Scaling Limitations
- **Database Size**: Practical limit of ~140TB, but performance degrades significantly above 10GB
- **Row Size**: Maximum row size of 1GB, but practical limit is much lower
- **Column Count**: Maximum of 32767 columns, but performance suffers with many columns
- **Table Size**: No hard limit, but performance considerations limit practical table size

#### Operational Limitations
- **No Built-in Replication**: No native support for master-slave or multi-master replication
- **Limited Backup Options**: Backup requires file copying, which may cause downtime
- **No Hot Backup**: Cannot create consistent backups while database is in use without additional tools
- **No Native Sharding**: Cannot partition data across multiple servers
- **Limited Monitoring**: Few built-in monitoring and performance tuning options

#### Feature Limitations
- **No Stored Procedures**: Limited procedural language support
- **No User-defined Functions**: Limited extensibility compared to PostgreSQL
- **No Full-Text Search**: Limited search capabilities without extensions
- **No JSON Support**: Limited JSON handling compared to modern databases
- **No Advanced Indexing**: Limited index types and optimization options

### SQLite Configuration Optimization

The current implementation includes these optimizations for better SQLite performance:

```javascript
// Enable WAL mode for better concurrency
db.run('PRAGMA journal_mode = WAL');

// Increase cache size
db.run('PRAGMA cache_size = -64000'); // 64MB cache

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Set busy timeout for concurrent access
db.run('PRAGMA busy_timeout = 5000'); // 5 seconds
```

### When to Use SQLite

SQLite is suitable for:
- **Development**: Local development and testing
- **Prototyping**: Rapid prototyping and MVP development
- **Mobile Apps**: Embedded mobile applications
- **Small Websites**: Low-traffic websites (< 100 concurrent users)
- **Edge Computing**: IoT devices and edge deployments
- **Single-User Applications**: Desktop applications and tools

### When NOT to Use SQLite

SQLite is NOT suitable for:
- **High-Traffic Websites**: Applications with > 100 concurrent users
- **Multi-Server Deployments**: Applications requiring database clustering
- **Complex Transactions**: Applications with complex transaction requirements
- **Real-Time Analytics**: Applications requiring real-time analytics and reporting
- **Large Datasets**: Databases > 10GB in size
- **High Availability**: Applications requiring 99.9%+ uptime

## Production Database: PostgreSQL

### Recommended for Production
PostgreSQL is the recommended database for production deployments due to:
- **ACID Compliance**: Full transaction support with proper isolation levels
- **Multi-Version Concurrency Control (MVCC)**: Excellent read/write concurrency
- **Extensibility**: Rich ecosystem of extensions and data types
- **Scalability**: Proven scalability to petabyte-scale databases
- **High Availability**: Native replication, failover, and clustering support
- **Performance**: Excellent performance for complex queries and large datasets
- **Maturity**: Battle-tested in production environments for decades

### PostgreSQL Advantages

#### Performance
- **Multi-Writer Architecture**: Multiple concurrent writers
- **Query Optimization**: Advanced query planner and optimizer
- **Index Types**: B-tree, hash, GiST, GIN, SP-GiST, BRIN indexes
- **Partitioning**: Native table partitioning for large datasets
- **Parallel Queries**: Parallel query execution for complex operations

#### Scalability
- **Replication**: Streaming replication, logical replication
- **Partitioning**: Table partitioning across multiple servers
- **Connection Pooling**: PgBouncer and other connection poolers
- **Sharding**: Horizontal scaling through third-party solutions

#### High Availability
- **Failover**: Automatic failover with minimal downtime
- **Backup**: Point-in-time recovery, continuous archiving
- **Monitoring**: Extensive monitoring and performance tuning tools
- **Load Balancing**: Built-in and third-party load balancing solutions

#### Features
- **Advanced Data Types**: JSON, JSONB, arrays, hstore, UUID, geometric types
- **Full-Text Search**: Built-in full-text search with multiple languages
- **Stored Procedures**: PL/pgSQL and other procedural languages
- **Extensions**: PostGIS, pg_trgm, hstore, and many others
- **Security**: Row-level security, encryption, authentication options

## Migration Strategy

### Phase 1: Assessment (Week 1-2)
- **Current Database Analysis**: Analyze current SQLite schema and usage patterns
- **Performance Testing**: Benchmark current performance under load
- **Migration Planning**: Plan schema changes and data migration strategy
- **Risk Assessment**: Identify potential migration risks and mitigation strategies

### Phase 2: Schema Migration (Week 3-4)
- **Schema Conversion**: Convert SQLite schema to PostgreSQL schema
- **Data Type Mapping**: Map SQLite data types to PostgreSQL equivalents
- **Index Optimization**: Re-optimize indexes for PostgreSQL
- **Constraint Migration**: Migrate foreign keys, unique constraints, etc.

### Phase 3: Data Migration (Week 5-6)
- **Data Export**: Export data from SQLite database
- **Data Import**: Import data into PostgreSQL database
- **Data Validation**: Validate data integrity after migration
- **Performance Testing**: Test performance after migration

### Phase 4: Application Updates (Week 7-8)
- **Database Driver**: Switch from sqlite3 to pg PostgreSQL driver
- **Connection Pooling**: Implement connection pooling with pgBouncer
- **Query Optimization**: Optimize queries for PostgreSQL
- **Configuration**: Update database configuration and environment variables

### Phase 5: Testing and Deployment (Week 9-10)
- **Integration Testing**: Test all application functionality with PostgreSQL
- **Performance Testing**: Validate performance meets requirements
- **Staging Deployment**: Deploy to staging environment
- **Production Deployment**: Deploy to production with rollback plan

## Schema Migration Guidelines

### Data Type Mapping

| SQLite Type | PostgreSQL Type | Notes |
|-------------|----------------|-------|
| INTEGER | INTEGER | Direct mapping |
| TEXT | TEXT | Direct mapping |
| REAL | DOUBLE PRECISION | Direct mapping |
| BLOB | BYTEA | Direct mapping |
| NUMERIC | NUMERIC | Direct mapping |
| DATETIME | TIMESTAMP | May need timezone handling |
| BOOLEAN | BOOLEAN | Direct mapping |

### SQL Differences

#### Auto-Increment
```sql
-- SQLite
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT
);

-- PostgreSQL
CREATE TABLE users (
  id SERIAL PRIMARY KEY
);
```

#### Date/Time Functions
```sql
-- SQLite
SELECT datetime('now');

-- PostgreSQL
SELECT NOW();
```

#### Limit/Offset
```sql
-- SQLite
SELECT * FROM users LIMIT 10 OFFSET 20;

-- PostgreSQL
SELECT * FROM users LIMIT 10 OFFSET 20;
-- (Same syntax, but PostgreSQL has better performance)
```

## Connection Pooling

### Why Connection Pooling?
- **Performance**: Reuse database connections instead of creating new ones
- **Scalability**: Handle more concurrent users with fewer database connections
- **Stability**: Prevent connection exhaustion under load

### Recommended: PgBouncer
PgBouncer is a lightweight connection pooler for PostgreSQL:
- **Transaction Pooling**: Best for OLTP workloads
- **Session Pooling**: Best for applications with persistent connections
- **Statement Pooling**: Limited use cases, mostly for reporting

### Implementation
```javascript
// Using pg with connection pooling
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Use pool for queries
async function query(sql, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}
```

## Backup and Recovery

### PostgreSQL Backup Options

#### pg_dump (Logical Backup)
```bash
# Full database backup
pg_dump -U username -d database_name > backup.sql

# Custom format backup (faster, supports partial restore)
pg_dump -U username -d database_name -Fc > backup.dump
```

#### pg_basebackup (Physical Backup)
```bash
# Physical backup for replication and PITR
pg_basebackup -U username -D /path/to/backup -Ft -P
```

#### Continuous Archiving
```bash
# Enable WAL archiving for point-in-time recovery
# Configure in postgresql.conf:
wal_level = replica
archive_mode = on
archive_command = 'cp %p /path/to/archive/%f'
```

### Restore Procedures

#### Logical Restore
```bash
# Restore from SQL dump
psql -U username -d database_name < backup.sql

# Restore from custom format
pg_restore -U username -d database_name backup.dump
```

#### Physical Restore
```bash
# Restore from physical backup
# Stop PostgreSQL, copy backup files, start PostgreSQL
```

## Monitoring and Performance

### Key Metrics to Monitor
- **Connection Count**: Number of active connections
- **Query Performance**: Slow query log, pg_stat_statements
- **Replication Lag**: Delay between primary and standby
- **Disk Usage**: Database size, WAL size
- **Cache Hit Ratio**: Buffer cache effectiveness
- **Lock Contention**: Table and row lock statistics

### Recommended Tools
- **pgAdmin**: Official PostgreSQL administration tool
- **pg_stat_statements**: Built-in query statistics
- **pgBadger**: Log analyzer and report generator
- **Prometheus + postgres_exporter**: Metrics collection
- **Grafana**: Visualization of PostgreSQL metrics

## Performance Tuning

### Configuration Parameters
```ini
# Memory settings
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 64MB
maintenance_work_mem = 512MB

# WAL settings
wal_buffers = 16MB
checkpoint_completion_target = 0.9
min_wal_size = 1GB
max_wal_size = 4GB

# Query tuning
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Indexing Strategy
- **B-tree Indexes**: Default, good for equality and range queries
- **Hash Indexes**: Good for equality queries only
- **GIN Indexes**: Good for array, JSONB, full-text search
- **GiST Indexes**: Good for geometric data, range queries
- **BRIN Indexes**: Good for very large tables with sorted data

## Security Considerations

### Authentication
- **Password Authentication**: MD5 or SCRAM-SHA-256
- **SSL/TLS**: Encrypt database connections
- **LDAP/Active Directory**: Enterprise authentication integration
- **pgBouncer**: Auth proxy for additional security layer

### Authorization
- **Row-Level Security**: Restrict row access based on user
- **Column-Level Permissions**: Grant/revoke on specific columns
- **Role-Based Access Control**: Organize users into roles
- **Network Security**: pg_hba.conf for network-level access control

### Data Encryption
- **Transparent Data Encryption (TDE)**: Encrypt data at rest
- **Column Encryption**: Encrypt specific columns with pgcrypto
- **SSL/TLS**: Encrypt data in transit
- **Backup Encryption**: Encrypt backup files

## Migration Checklist

### Pre-Migration
- [ ] Complete database schema analysis
- [ ] Create migration plan with timeline
- [ ] Set up PostgreSQL test environment
- [ ] Test migration process with sample data
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window
- [ ] Notify stakeholders of planned downtime

### During Migration
- [ ] Create final SQLite backup
- [ ] Convert schema to PostgreSQL
- [ ] Migrate data to PostgreSQL
- [ ] Validate data integrity
- [ ] Update application configuration
- [ ] Deploy application updates
- [ ] Run integration tests
- [ ] Monitor application performance

### Post-Migration
- [ ] Monitor database performance
- [ ] Check application logs for errors
- [ ] Validate all functionality works correctly
- [ ] Optimize slow queries
- [ ] Set up monitoring and alerting
- [ ] Document migration process
- [ ] Train team on PostgreSQL administration
- [ ] Update disaster recovery procedures

## References

### Documentation
- [PostgreSQL Official Documentation](https://www.postgresql.org/docs/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [pgBouncer Documentation](https://www.pgbouncer.org/usage.html)

### Tools
- [pgAdmin](https://www.pgadmin.org/)
- [DBeaver](https://dbeaver.io/)
- [DataGrip](https://www.jetbrains.com/datagrip/)

### Best Practices
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Database Scaling Strategies](https://www.enterprisedb.com/blog/scaling-postgresql/)
- [High Availability PostgreSQL](https://www.postgresql.org/about/press/presskits158/)
