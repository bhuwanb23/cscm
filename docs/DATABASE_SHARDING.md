# CSCM Database Sharding Strategy

## Overview

This document outlines the database sharding strategy for the Cognitive Supply Chain Mesh (CSCM) system to support horizontal scaling and improved performance as the system grows.

## Current Database Architecture

### Current State
- **Database**: SQLite (file-based)
- **Deployment**: Single instance per service
- **Scaling**: Vertical scaling only
- **Limitations**: Single-writer limitations, file I/O bottlenecks

### Current Tables
- `inventory` - Product inventory by store
- `orders` - Customer orders
- `order_items` - Order line items
- `shipments` - Shipping information
- `shipment_items` - Shipment line items
- `users` - User accounts
- `events` - System events

## Sharding Strategy

### Sharding Approach: Horizontal Sharding

**Rationale**: Horizontal sharding provides better scalability and performance for read-heavy workloads, which is expected in supply chain operations.

### Sharding Key Selection

**Primary Sharding Key**: `store_id`

**Rationale**:
- Most queries are store-centric (inventory, orders, shipments by store)
- Store boundaries provide natural data isolation
- Enables regional deployment (shards by geography)
- Simplifies cross-shard queries (most operations are single-shard)

**Secondary Sharding Keys**:
- `orders`: `store_id` (primary), `order_id` (for direct lookups)
- `shipments`: `from_location` or `to_location` (for logistics optimization)
- `users`: `region` (for geographical distribution)

### Shard Distribution

**Initial Shard Count**: 4 shards
- Shard 0: Stores 0-249
- Shard 1: Stores 250-499
- Shard 2: Stores 500-749
- Shard 3: Stores 750-999

**Sharding Algorithm**: Hash-based with consistent hashing
```
shard_id = hash(store_id) % total_shards
```

**Consistent Hashing**: Uses SHA-256 hash of store_id to ensure even distribution and minimize reshuffling when adding/removing shards.

## Shard Architecture

### Physical Layout

```
┌─────────────────────────────────────────────────────┐
│                    Application Layer                    │
│              (Backend + AI/ML Services)                 │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────┐
│                  Sharding Router                      │
│         (Determine target shard by store_id)          │
└────────────────────────┬────────────────────────────┘
                         │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Shard 0    │ │   Shard 1    │ │   Shard 2    │
│  Stores 0-249│ │Stores 250-499│ │Stores 500-749│
└──────────────┘ └──────────────┘ └──────────────┘
```

### Data Distribution

**Inventory Table**:
- Sharded by `store_id`
- Each store's inventory data resides on a single shard
- Cross-shard queries: Aggregation required for multi-store operations

**Orders Table**:
- Sharded by `store_id`
- Order items follow parent order shard
- Cross-shard queries: Customer orders spanning multiple stores

**Shipments Table**:
- Sharded by `from_location` (origin)
- Cross-shard queries: Multi-leg shipments spanning shards

**Users Table**:
- Sharded by `region` (geographical)
- Authentication routes to appropriate shard
- Cross-shard queries: User searches across regions

## Query Routing

### Single-Shard Queries
Queries that access data for a single store are routed to the appropriate shard:
```sql
SELECT * FROM inventory WHERE store_id = 'STORE-001';
-- Routes to shard: hash('STORE-001') % 4
```

### Cross-Shard Queries
Queries that span multiple stores require coordination across shards:
```sql
SELECT store_id, SUM(quantity) as total_inventory 
FROM inventory 
GROUP BY store_id;
-- Requires query coordinator to aggregate results from all shards
```

### Distributed Transactions
Transactions that span multiple shards use two-phase commit:
1. Prepare phase: Lock resources on all involved shards
2. Commit phase: Commit or rollback on all shards

## Migration Strategy

### Phase 1: Database Selection (Pre-Sharding)
**Objective**: Migrate from SQLite to PostgreSQL for production-grade sharding support

**Steps**:
1. Set up PostgreSQL cluster (managed or self-hosted)
2. Create database schema in PostgreSQL
3. Migrate existing SQLite data to PostgreSQL
4. Update application to use PostgreSQL driver
5. Test thoroughly before proceeding

**Timeline**: 2-3 weeks

### Phase 2: Sharding Infrastructure Setup
**Objective**: Set up sharding infrastructure

**Steps**:
1. Deploy 4 PostgreSQL instances (or manage service)
2. Configure database replication for high availability
3. Set up connection pooling
4. Configure sharding router middleware
5. Implement health checks for each shard

**Timeline**: 2 weeks

### Phase 3: Application Sharding Integration
**Objective**: Integrate sharding into application code

**Steps**:
1. Create sharding middleware
2. Update database access layer to use sharding router
3. Implement query coordinator for cross-shard queries
4. Update connection management for shard pools
5. Add sharding metrics and monitoring

**Timeline**: 3-4 weeks

### Phase 4: Data Migration to Shards
**Objective**: Migrate data from single database to shards

**Steps**:
1. Create mapping from store_id to shard_id
2. Export data from PostgreSQL
3. Import data to appropriate shards
4. Verify data integrity
5. Update application to use sharded databases

**Timeline**: 2 weeks

### Phase 5: Cut-over to Sharded Architecture
**Objective**: Switch production traffic to sharded architecture

**Steps**:
1. Run parallel systems (single DB + sharded)
2. Validate data consistency
3. Gradually increase traffic to sharded system
4. Monitor performance and errors
5. Complete cut-over

**Timeline**: 1-2 weeks

## Sharding Middleware Design

### Shard Router Interface

```javascript
class ShardRouter {
  async getShard(shardKey) {
    // Returns shard information for a given key
  }
  
  async executeQuery(sql, params, shardKey) {
    // Routes query to appropriate shard
  }
  
  async executeCrossShardQuery(sql, params, shardKeys) {
    // Coordinates query across multiple shards
  }
}
```

### Connection Pooling

Each shard maintains its own connection pool:
- **Pool Size**: 20 connections per shard
- **Max Overflow**: 10 connections
- **Idle Timeout**: 30 seconds
- **Connection Lifetime**: 1 hour

### Load Balancing

Shard-level load balancing:
- **Algorithm**: Round-robin with health checks
- **Health Checks**: Every 5 seconds
- **Failover**: Automatic failover to healthy shard
- **Recovery**: Automatic reintegration when shard recovers

## Cross-Shard Query Strategies

### Aggregation Queries

**Approach**: Map-Reduce pattern
1. **Map Phase**: Execute query on all relevant shards
2. **Reduce Phase**: Aggregate results from all shards
3. **Return**: Combined result set

**Example**: Total inventory across all stores
```javascript
const storeIds = await getAllStoreIds();
const shardQueries = storeIds.map(storeId => 
  shardRouter.executeQuery('SELECT SUM(quantity) FROM inventory WHERE store_id = ?', [storeId], storeId)
);
const results = await Promise.all(shardQueries);
const total = results.reduce((sum, result) => sum + result[0].sum, 0);
```

### Join Queries

**Approach**: Hybrid strategy
1. **Single-Shard Joins**: Execute on shard where primary data resides
2. **Cross-Shard Joins**: Client-side join after fetching from both shards
3. **Broadcast Joins**: Execute on all shards and filter results

## Consistency and Replication

### Replication Strategy

**Primary-Replica**:
- Each shard has 1 primary + 2 replicas
- Writes go to primary, replicas are updated asynchronously
- Reads can be served from replicas for read scalability

**Eventual Consistency**:
- Cross-shard operations are eventually consistent
- Use message queues (Redis pub/sub) for eventual consistency
- Implement conflict resolution for concurrent updates

### Data Consistency Guarantees

**Single-Shard Operations**: ACID transactions within a shard
**Cross-Shard Operations**: Eventually consistent with conflict resolution
**Read-Your-Writes**: Maintained within a shard
**Monotonic Reads**: Maintained within a shard

## Failure Handling

### Shard Failure

**Detection**: Health checks every 5 seconds
**Failover**: Automatic routing to replica
**Recovery**: Automatic reintegration when shard returns
**Data Recovery**: Replication from primary or backup

### Network Partition

**Split-Brain Prevention**: Require quorum for writes
**Reads**: Continue from local shard if partitioned
**Writes**: Reject if quorum not available
**Recovery**: Automatic resynchronization when partition heals

### Data Corruption

**Detection**: Periodic integrity checks
**Recovery**: Restore from point-in-time backup
**Prevention**: Write-ahead logging and checksums

## Monitoring and Observability

### Shard Metrics

**Per-Shard Metrics**:
- Connection pool utilization
- Query latency (p50, p95, p99)
- Query throughput
- Error rate
- Replication lag

**Aggregate Metrics**:
- Overall query latency
- Cross-shard query latency
- Data distribution skew
- Hot shard detection

### Alerting

**Alert Conditions**:
- Shard down > 30 seconds
- Query latency > 2 seconds (p95)
- Connection pool exhaustion
- Replication lag > 5 seconds
- Data skew > 20%

## Rollback Procedure

### Rollback to Single Database

**Trigger**: Critical issues with sharding architecture

**Steps**:
1. Stop all writes to sharded system
2. Export data from all shards
3. Import data to single PostgreSQL instance
4. Update application configuration
5. Restart application
6. Validate functionality

**Timeline**: 4-6 hours

## Future Enhancements

### Automatic Rebalancing
- Detect hot shards (uneven data distribution)
- Automatically redistribute data
- Minimize downtime during rebalancing

### Dynamic Shard Addition
- Add new shards without downtime
- Consistent hashing minimizes data movement
- Gradual data migration to new shard

### Geo-Distribution
- Deploy shards in multiple regions
- Route queries to nearest shard
- Replicate data across regions for disaster recovery

### Hybrid Sharding
- Combine sharding with partitioning
- Use different sharding keys for different tables
- Optimize for specific query patterns

## Cost Considerations

### Infrastructure Costs
- **Database Instances**: 4x PostgreSQL instances (or managed service)
- **Storage**: Increased storage for replication
- **Network**: Additional network traffic between shards
- **Monitoring**: Additional monitoring infrastructure

### Performance Benefits
- **Improved Query Performance**: Smaller datasets per shard
- **Increased Throughput**: Parallel query execution
- **Better Resource Utilization**: Distributed load
- **Enhanced Scalability**: Horizontal scaling

### ROI Analysis
- **Cost Increase**: ~2-3x current database costs
- **Performance Improvement**: 3-5x query performance
- **Scalability**: 10x capacity increase
- **Time to Value**: Immediate performance benefits, long-term scalability

## Implementation Timeline

### Total Duration: 10-12 weeks

**Phase 1**: PostgreSQL Migration (2-3 weeks)
**Phase 2**: Sharding Infrastructure (2 weeks)
**Phase 3**: Application Integration (3-4 weeks)
**Phase 4**: Data Migration (2 weeks)
**Phase 5**: Cut-over (1-2 weeks)

## Success Criteria

- [ ] All shards operational and healthy
- [ ] Data evenly distributed across shards (skew < 20%)
- [ ] Single-shard queries meet performance targets
- [ ] Cross-shard queries meet performance targets
- [ ] Failure recovery tested and validated
- [ ] Monitoring and alerting operational
- [ ] Rollback procedure tested and documented

## References

- **PostgreSQL Sharding**: https://www.postgresql.org/docs/current/sharding.html
- **Citus Extension**: https://www.citusdata.com/
- **Vitess**: https://vitess.io/
- **Database Sharding Best Practices**: Industry standards and patterns

## Last Updated
2026-09-10 - Initial sharding strategy documentation