# CSCM Troubleshooting Guide

## Table of Contents
- [Common Issues](#common-issues)
- [Backend Issues](#backend-issues)
- [AI/ML Service Issues](#aiml-service-issues)
- [Gateway Issues](#gateway-issues)
- [Mobile App Issues](#mobile-app-issues)
- [Database Issues](#database-issues)
- [Redis Issues](#redis-issues)
- [Performance Issues](#performance-issues)
- [Recovery Procedures](#recovery-procedures)

## Common Issues

### Service Won't Start

**Symptoms**:
- Service fails to start
- Port already in use error
- Missing dependencies error

**Troubleshooting Steps**:
1. Check if port is already in use:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   # Linux/Mac
   lsof -i :3000
   ```
2. Install dependencies:
   ```bash
   # Backend
   cd backend && npm install
   # AI/ML
   cd ai-ml && pip install -r requirements.txt
   ```
3. Check environment variables:
   ```bash
   # Backend
   cat backend/.env
   # AI/ML
   check environment variables in code
   ```
4. Check logs for specific error messages

**Solutions**:
- Kill process using the port
- Install missing dependencies
- Set correct environment variables
- Fix configuration errors

### Container Build Failures

**Symptoms**:
- Docker build fails
- Dependency installation errors
- File permission errors

**Troubleshooting Steps**:
1. Check Docker logs:
   ```bash
   docker-compose logs backend
   ```
2. Check Dockerfile syntax
3. Verify file permissions
4. Check network connectivity during build

**Solutions**:
- Fix Dockerfile syntax errors
- Add missing build dependencies
- Set correct file permissions
- Use build cache appropriately

## Backend Issues

### Backend API Not Responding

**Symptoms**:
- API requests timeout
- 502 Bad Gateway errors
- Service appears healthy but doesn't respond

**Troubleshooting Steps**:
1. Check if backend service is running:
   ```bash
   curl http://localhost:3000/health
   ```
2. Check backend logs:
   ```bash
   tail -f backend/logs/combined.log
   ```
3. Check database connection
4. Check Redis connection (if configured)

**Solutions**:
- Restart backend service
- Fix database connection issues
- Fix Redis connection issues
- Check resource constraints

### Database Connection Errors

**Symptoms**:
- "Database locked" errors
- "SQLITE_CANTOPEN" errors
- Query timeouts

**Troubleshooting Steps**:
1. Check database file permissions
2. Check if database file exists
3. Check database file integrity
4. Check concurrent access

**Solutions**:
- Fix file permissions
- Create database file if missing
- Enable WAL mode for better concurrency
- Use connection pooling

### JWT Authentication Failures

**Symptoms**:
- 401 Unauthorized errors
- Token validation failures
- Invalid signature errors

**Troubleshooting Steps**:
1. Check JWT secret configuration
2. Verify token format
3. Check token expiration
4. Verify token is being sent correctly

**Solutions**:
- Set correct JWT secret
- Use valid token format
- Refresh expired tokens
- Include Authorization header correctly

### Rate Limiting Issues

**Symptoms**:
- 429 Too Many Requests errors
- Rate limit not working
- Rate limit too strict

**Troubleshooting Steps**:
1. Check rate limit configuration
2. Check Redis connection (if using Redis-based limiting)
3. Check rate limit headers in response
4. Verify client IP detection

**Solutions**:
- Adjust rate limit thresholds
- Fix Redis connection
- Adjust rate limit window
- Implement proper IP detection

## AI/ML Service Issues

### AI/ML Service Not Responding

**Symptoms**:
- AI/ML requests timeout
- 502 Bad Gateway errors
- Model loading errors

**Troubleshooting Steps**:
1. Check if AI/ML service is running:
   ```bash
   curl http://localhost:8000/health
   ```
2. Check AI/ML logs
3. Check model weights availability
4. Check Python dependencies

**Solutions**:
- Restart AI/ML service
- Download missing model weights
- Install missing Python dependencies
- Check resource availability

### Model Loading Failures

**Symptoms**:
- Model not found errors
- Shape mismatch errors
- CUDA out of memory errors

**Troubleshooting Steps**:
1. Check model file paths
2. Check model file integrity
3. Check GPU memory availability
4. Check model version compatibility

**Solutions**:
- Fix model file paths
- Download corrupted model files
- Reduce batch size or model size
- Use compatible model versions

### API Documentation Not Loading

**Symptoms**:
- /docs endpoint returns 404
- Swagger UI not loading
- OpenAPI spec generation errors

**Troubleshooting Steps**:
1. Check FastAPI version
2. Check router configuration
3. Check Pydantic model definitions
4. Check for import errors

**Solutions**:
- Update FastAPI to latest version
- Fix router configuration
- Fix Pydantic model definitions
- Fix import errors

## Gateway Issues

### Gateway Routing Failures

**Symptoms**:
- Requests not reaching backend
- AI/ML requests not routing correctly
- 502 Bad Gateway errors

**Troubleshooting Steps**:
1. Check gateway health:
   ```bash
   curl http://localhost:8080/health
   ```
2. Check AI/ML health:
   ```bash
   curl http://localhost:8080/health/python
   ```
3. Check routing logic in gateway logs
4. Verify upstream service URLs

**Solutions**:
- Fix upstream service URLs
- Fix routing logic
- Restart gateway service
- Check network connectivity

### Circuit Breaker Issues

**Symptoms**:
- All requests failing with 503
- Circuit breaker stuck in open state
- Services appear healthy but requests fail

**Troubleshooting Steps**:
1. Check circuit breaker state:
   ```bash
   curl http://localhost:8080/metrics
   ```
2. Check circuit breaker logs
3. Check upstream service health
4. Check failure threshold configuration

**Solutions**:
- Manually reset circuit breaker
- Fix upstream service issues
- Adjust circuit breaker thresholds
- Improve error detection logic

## Mobile App Issues

### App Won't Connect to Backend

**Symptoms**:
- Network request errors
- Connection timeout errors
- CORS errors

**Troubleshooting Steps**:
1. Check backend is running
2. Check API URL configuration
3. Check network connectivity
4. Check CORS configuration

**Solutions**:
- Start backend service
- Fix API URL configuration
- Ensure network connectivity
- Fix CORS configuration

### Authentication Errors in Mobile App

**Symptoms**:
- Login failures
- Token validation errors
- Unauthorized access errors

**Troubleshooting Steps**:
1. Check API client configuration
2. Check token storage
3. Check token format
4. Check backend authentication

**Solutions**:
- Fix API client configuration
- Clear and regenerate tokens
- Use correct token format
- Fix backend authentication

### Mobile App Performance Issues

**Symptoms**:
- Slow app startup
- Slow screen transitions
- High memory usage

**Troubleshooting Steps**:
1. Check bundle size
2. Check image asset sizes
3. Check for memory leaks
4. Check component re-renders

**Solutions**:
- Optimize bundle size
- Compress images
- Fix memory leaks
- Optimize component rendering

## Database Issues

### SQLite Database Locked

**Symptoms**:
- "Database is locked" errors
- Concurrent write failures
- Query timeouts

**Troubleshooting Steps**:
1. Check for long-running transactions
2. Check for multiple writers
3. Check file system permissions
4. Check database file integrity

**Solutions**:
- Enable WAL mode
- Implement connection pooling
- Fix file permissions
- Use proper transaction management

### Query Performance Issues

**Symptoms**:
- Slow query execution
- High CPU usage
- Memory spikes

**Troubleshooting Steps**:
1. Identify slow queries
2. Check query execution plans
3. Check for missing indexes
4. Check for large result sets

**Solutions**:
- Add database indexes
- Optimize query structure
- Implement pagination
- Cache frequently accessed data

## Redis Issues

### Redis Connection Failures

**Symptoms**:
- Connection refused errors
- Connection timeout errors
- Authentication errors

**Troubleshooting Steps**:
1. Check if Redis is running:
   ```bash
   redis-cli ping
   ```
2. Check Redis configuration
3. Check network connectivity
4. Check Redis logs

**Solutions**:
- Start Redis service
- Fix Redis configuration
- Fix network connectivity
- Fix authentication

### Memory Issues

**Symptoms**:
- Redis out of memory errors
- Eviction notices
- Performance degradation

**Troubleshooting Steps**:
1. Check Redis memory usage:
   ```bash
   redis-cli info memory
   ```
2. Check maxmemory configuration
3. Check key count
4. Check key sizes

**Solutions**:
- Increase maxmemory limit
- Implement key expiration
- Delete unused keys
- Use appropriate data structures

## Performance Issues

### Slow API Response Times

**Symptoms**:
- API requests taking >2 seconds
- High latency
- Poor user experience

**Troubleshooting Steps**:
1. Check response time metrics
2. Check database query times
3. Check external service call times
4. Check resource utilization

**Solutions**:
- Implement caching
- Optimize database queries
- Optimize external service calls
- Scale horizontally

### High Memory Usage

**Symptoms**:
- Out of memory errors
- Frequent garbage collection
- Performance degradation

**Troubleshooting Steps**:
1. Check memory usage metrics
2. Check for memory leaks
3. Check large object allocations
4. Check caching configuration

**Solutions**:
- Fix memory leaks
- Optimize caching strategy
- Implement object pooling
- Increase memory limits

### High CPU Usage

**Symptoms**:
- High CPU utilization
- Slow response times
- System instability

**Troubleshooting Steps**:
1. Check CPU usage metrics
2. Check for infinite loops
3. Check for inefficient algorithms
4. Check for blocking operations

**Solutions**:
- Fix infinite loops
- Optimize algorithms
- Use async operations
- Scale horizontally

## Recovery Procedures

### Service Recovery

**Backend Service Recovery**:
1. Stop the service
2. Check logs for errors
3. Fix identified issues
4. Restart the service
5. Verify health endpoint

**AI/ML Service Recovery**:
1. Stop the service
2. Check model loading logs
3. Fix model loading issues
4. Restart the service
5. Verify health endpoint

**Gateway Recovery**:
1. Stop the gateway
2. Check upstream service health
3. Fix routing issues
4. Restart the gateway
5. Verify health endpoint

### Data Recovery

**Database Recovery**:
1. Stop all database writes
2. Backup current database file
3. Check database integrity
4. Recover from backup if needed
5. Restart services

**Redis Recovery**:
1. Stop Redis
2. Backup current data
3. Check data integrity
4. Flush data if corrupted
5. Restart Redis

### Configuration Recovery

**Rollback Configuration**:
1. Identify last known good configuration
2. Restore configuration files
3. Restart affected services
4. Verify functionality

**Environment Variable Recovery**:
1. Check .env file
2. Restore from .env.example if needed
3. Restart services
4. Verify functionality

### Emergency Procedures

**Full System Outage**:
1. Check all service health
2. Check infrastructure (Docker, Kubernetes)
3. Check network connectivity
4. Check resource availability
5. Restart services in dependency order
6. Verify end-to-end functionality

**Database Corruption**:
1. Stop all database access
2. Backup corrupted database
3. Restore from last known good backup
4. Verify data integrity
5. Restart services

**Security Incident**:
1. Isolate affected systems
2. Review access logs
3. Change compromised credentials
4. Patch vulnerabilities
5. Restore from clean backup if needed
6. Conduct security audit

## Diagnostic Commands

### Health Checks
```bash
# Backend health
curl http://localhost:3000/health

# AI/ML health
curl http://localhost:8000/health

# Gateway health
curl http://localhost:8080/health

# Gateway AI/ML health
curl http://localhost:8080/health/python
```

### Log Viewing
```bash
# Backend logs
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Docker logs
docker-compose logs -f backend
docker-compose logs -f ai-ml
docker-compose logs -f gateway
```

### Service Status
```bash
# Docker Compose
docker-compose ps

# Kubernetes
kubectl get pods -n cscm
kubectl get services -n cscm
kubectl get hpa -n cscm
```

### Database Operations
```bash
# SQLite database check
sqlite3 backend/data/cscm_local.db ".tables"
sqlite3 backend/data/cscm_local.db "SELECT COUNT(*) FROM inventory"
```

### Redis Operations
```bash
# Redis check
redis-cli ping
redis-cli info
redis-cli keys *
```

## Contact and Support

For issues not covered in this guide:
- Check architecture documentation: `docs/ARCHITECTURE.md`
- Check API integration guide: `docs/API_INTEGRATION_GUIDE.md`
- Check deployment guide: `DEPLOYMENT_GUIDE.md`
- Review source code for specific implementation details
- Contact development team for critical issues

## Last Updated
2026-09-10 - Initial troubleshooting guide creation