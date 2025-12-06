# Redis Local Setup Guide

This guide explains how to set up Redis for local development of the CSCM backend.

## Prerequisites

- Windows, macOS, or Linux operating system
- Node.js and npm installed

## Installing Redis

### Option 1: Using Docker (Recommended)

1. Install Docker Desktop from https://www.docker.com/products/docker-desktop

2. Run Redis container:
   ```bash
   docker run -d -p 6379:6379 --name cscm-redis redis:latest
   ```

3. Verify Redis is running:
   ```bash
   docker ps
   ```

### Option 2: Native Installation (Windows)

1. Download Redis for Windows from https://github.com/microsoftarchive/redis/releases

2. Extract and run:
   ```bash
   redis-server.exe
   ```

### Option 3: Native Installation (macOS)

1. Install using Homebrew:
   ```bash
   brew install redis
   ```

2. Start Redis service:
   ```bash
   brew services start redis
   ```

### Option 4: Native Installation (Linux - Ubuntu/Debian)

1. Update package list:
   ```bash
   sudo apt update
   ```

2. Install Redis:
   ```bash
   sudo apt install redis-server
   ```

3. Start Redis service:
   ```bash
   sudo systemctl start redis-server
   ```

## Configuration

### Environment Variables

Create a `.env` file in the backend root directory with the following variables:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Default Configuration

If no environment variables are set, the system will use:
- Host: `localhost`
- Port: `6379`
- Password: None (default)

## Testing the Installation

1. Start Redis server using one of the methods above

2. Run the test script:
   ```bash
   npm run test-redis
   ```

3. You should see output similar to:
   ```
   Testing Redis Messaging...
   ✓ Connected to Redis successfully
   ✓ Published test message to inventory.update.TEST-STORE
   ✓ Subscribed to inventory.update.TEST-STORE
   ✓ Received message on topic inventory.update.TEST-STORE: { productId: 'TEST-PRODUCT', ... }
   ✓ Disconnected from Redis

   🎉 Redis messaging test completed successfully!
   ```

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure Redis server is running
   - Check if the port (6379) is correct
   - Verify firewall settings

2. **Permission Denied**
   - On Linux/macOS, try running with sudo
   - Check Redis configuration file permissions

3. **Cannot Connect to Docker Container**
   - Ensure Docker is running
   - Check if the container is running: `docker ps`
   - Restart the container if needed: `docker restart cscm-redis`

### Verifying Redis Installation

You can verify Redis is working by using the Redis CLI:

```bash
redis-cli ping
```

If Redis is running, you should get:
```
PONG
```

## Message Topics

The CSCM system uses the following Redis topics for messaging:

1. `inventory.update.{storeId}` - Inventory updates from stores
2. `demand.forecast.{storeId}` - Demand forecasts for stores
3. `shipment.status.{shipmentId}` - Shipment status updates
4. `alerts` - System alerts and notifications
5. `decisions.{agentType}` - Decision recommendations

## Security Considerations

For production use, consider:

1. Setting a password for Redis
2. Binding Redis to localhost only
3. Using SSL/TLS encryption
4. Configuring firewall rules

For local development, the default configuration is sufficient.