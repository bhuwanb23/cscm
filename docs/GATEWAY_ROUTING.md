# CSCM API Gateway Routing Documentation

## Overview

The CSCM API Gateway serves as the single entry point for all API requests, routing traffic between the Express backend API and the Python AI/ML service based on request paths and domains.

## Architecture

```
Client → Gateway (Port 8080) → Backend API (Port 3000) / AI/ML Service (Port 8000)
```

## Gateway Configuration

### Server Settings
- **Port**: 8080 (configurable via `GATEWAY_PORT` environment variable)
- **Environment**: Production mode recommended for deployment
- **Logging**: All requests are logged with method, path, and client IP

### CORS Configuration
The gateway currently uses permissive CORS settings for development:
```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,PUT,POST,DELETE,OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Note**: For production, configure specific allowed origins.

## Routing Logic

### Domain-Based Routing

The gateway uses intelligent path inspection to route requests to the appropriate backend service:

#### AI/ML Domains
Requests matching the following domains are routed to the Python AI/ML service (Port 8000):
- `demand`
- `demand-planning`
- `routing`
- `supplier`
- `customer`
- `anomaly`
- `coordination`
- `simulation`
- `explain`
- `nlp`
- `kg` (Knowledge Graph)
- `causal`
- `vision`
- `learning`
- `uncertainty`
- `monitoring`

#### Backend API Domains
All other requests are routed to the Express backend API (Port 3000):
- `auth`
- `events`
- `inventory`
- `orders`
- `shipments`

#### Special Inventory Routing
The `inventory` domain has special handling:
- **AI/ML routed actions**: `optimize`, `recommendation`, `ss-policy`, `stochastic-optimize`, `rl-train`, `mip-optimize`, `batch-optimize`
- **Backend routed actions**: All other inventory operations

### Routing Algorithm

```javascript
function isAiMlPath(pathname) {
  // Request must start with /api/v1/
  if (!pathname.startsWith('/api/v1/')) return false;
  
  // Extract domain from path
  const rest = pathname.slice(8); // Remove /api/v1/
  const firstSlash = rest.indexOf('/');
  const domain = firstSlash === -1 ? rest : rest.slice(0, firstSlash);
  const subpath = firstSlash === -1 ? '' : rest.slice(firstSlash + 1);
  
  // Check if domain is in AI/ML list
  if (aiMlDomains.includes(domain) && domain !== 'inventory') return true;
  
  // Special inventory routing
  if (domain === 'inventory') {
    const actionSegment = subpath.split('/')[0];
    return aiMlActions.includes(actionSegment);
  }
  
  return false;
}
```

## Endpoints

### Gateway Health Endpoints

#### Root Health Check
```
GET /health
```
Returns gateway health status and AI/ML service status:
```json
{
  "status": "healthy",
  "service": "api-gateway",
  "timestamp": "2026-09-10T14:25:00Z",
  "aiMl": {
    "status": "healthy",
    "checkedAt": "2026-09-10T14:25:00Z"
  }
}
```

#### AI/ML Service Health Check
```
GET /health/python
```
Returns detailed AI/ML Python service health:
```json
{
  "service": "ai-ml-python",
  "status": "healthy",
  "timestamp": "2026-09-10T14:25:00Z"
}
```

### Proxied Backend API Endpoints

#### Authentication
```
POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/auth/profile (requires JWT)
```

#### Events
```
POST /api/v1/events
GET /api/v1/events
```

#### Inventory
```
GET /api/v1/inventory/store/:storeId
GET /api/v1/inventory/store/:storeId/product/:productId
PUT /api/v1/inventory
PATCH /api/v1/inventory/store/:storeId/product/:productId/quantity
```

#### Orders
```
POST /api/v1/orders
GET /api/v1/orders/:orderId
PATCH /api/v1/orders/:orderId/status
GET /api/v1/orders/store/:storeId
```

#### Shipments
```
POST /api/v1/shipments
GET /api/v1/shipments/:shipmentId
PATCH /api/v1/shipments/:shipmentId/status
GET /api/v1/shipments/status/:status
GET /api/v1/shipments/location/:location
```

### Proxied AI/ML Service Endpoints

#### Demand Forecasting
```
POST /api/v1/demand/forecast
GET /api/v1/demand/metrics/{sku_id}/{store_id}
POST /api/v1/demand/batch-forecast
```

#### Inventory Optimization
```
POST /api/v1/inventory/optimize
POST /api/v1/inventory/recommendation
POST /api/v1/inventory/ss-policy
POST /api/v1/inventory/stochastic-optimize
```

#### Routing & Logistics
```
POST /api/v1/routing/optimize
POST /api/v1/routing/delivery-schedule
POST /api/v1/routing/edge-deploy
```

#### Supplier Risk
```
POST /api/v1/supplier/risk-assess
POST /api/v1/supplier/backup-finder
POST /api/v1/supplier/performance-track
```

#### Customer Demand
```
POST /api/v1/customer/segment
POST /api/v1/customer/trend-analyze
POST /api/v1/customer/nlp-summarize
```

#### Anomaly Detection
```
POST /api/v1/anomaly/detect
POST /api/v1/anomaly/alert
```

#### Multi-Agent Coordination
```
POST /api/v1/coordination/coordinate
POST /api/v1/coordination/warehouse-assign
```

#### Digital Twin Simulation
```
POST /api/v1/simulation/run
POST /api/v1/simulation/event-generate
```

#### Explainability
```
POST /api/v1/explain/shap
POST /api/v1/explain/lime
```

#### NLP & LLM
```
POST /api/v1/nlp/process
POST /api/v1/nlp/embed
```

#### Knowledge Graph
```
POST /api/v1/kg/query
POST /api/v1/kg/embed
```

#### Causal Inference
```
POST /api/v1/causal/discover
POST /api/v1/causal/intervene
```

#### Computer Vision
```
POST /api/v1/vision/inspect
POST /api/v1/vision/classify
```

#### Continual Learning
```
POST /api/v1/learning/update
POST /api/v1/learning/retrain
```

#### Uncertainty Quantification
```
POST /api/v1/uncertainty/quantify
POST /api/v1/uncertainty/sampling
```

#### Model Monitoring
```
GET /api/v1/monitoring/status
POST /api/v1/monitoring/check-drift
```

## Error Handling

### Proxy Error Handling
The gateway handles upstream service failures gracefully:

```javascript
function proxyErrorHandler(err, req, res) {
  logger.error(`Proxy error for ${req.method} ${req.originalUrl}: ${err.message}`);
  if (!res.headersSent) {
    res.status(502).json({
      error: 'Upstream service unavailable',
      message: err.code === 'ECONNREFUSED'
        ? 'Service not running'
        : err.message
    });
  }
}
```

### Error Responses
- **502 Bad Gateway**: Upstream service unavailable
- **504 Gateway Timeout**: Upstream service timeout
- **500 Internal Server Error**: Gateway processing error

## Configuration

### Environment Variables
```env
GATEWAY_PORT=8080              # Gateway port
AI_ML_API_URL=http://localhost:8000  # AI/ML service URL
NODE_ENV=production             # Environment mode
```

### Docker Configuration
In Docker Compose, the gateway uses service DNS names:
```yaml
environment:
  - AI_ML_API_URL=http://ai-ml:8000
  - BACKEND_API_URL=http://backend:3000
```

## Monitoring

### Request Logging
All requests are logged with:
- HTTP method
- Request path
- Client IP
- Proxy target (Backend or AI/ML)

### Health Monitoring
The gateway performs active health checks on the AI/ML service:
- Check interval: Every request to `/health`
- Timeout: 1 second for health checks
- Status tracking: Last known status and check time

### Metrics
Gateway metrics are available through the backend metrics endpoint when routed through the gateway.

## Security Considerations

### Current Limitations
- Wide-open CORS configuration (should be restricted in production)
- No rate limiting at gateway level (rate limiting is at backend)
- No authentication at gateway (authentication is at backend)

### Recommended Improvements
1. Implement gateway-level rate limiting
2. Configure CORS with specific allowed origins
3. Add request validation at gateway
4. Implement API key authentication
5. Add request/response logging for audit trails

## Deployment

### Local Development
```bash
# Start gateway
cd backend
node src/gateway/gateway.js
```

### Docker Compose
```bash
# Start gateway with full stack
docker-compose -f docker-compose.dev.yml up
```

### Kubernetes
Gateway is deployed as a LoadBalancer service in Kubernetes:
```yaml
spec:
  type: LoadBalancer
  ports:
  - port: 8080
    targetPort: 8080
```

## Troubleshooting

### Gateway Not Starting
1. Check if port 8080 is available
2. Verify environment variables are set
3. Check logs for configuration errors

### Routing Issues
1. Verify upstream services are running
2. Check service DNS names in Docker/Kubernetes
3. Review routing logic in gateway logs

### Health Check Failures
1. Verify AI/ML service is accessible
2. Check AI/ML service health endpoint
3. Review network connectivity between services

## Migration Guide

### From Direct Service Access
**Before**: Client → Backend (3000) / AI/ML (8000)
**After**: Client → Gateway (8080) → Backend / AI/ML

### URL Changes
- Backend URLs: `http://localhost:3000/api/v1/*` → `http://localhost:8080/api/v1/*`
- AI/ML URLs: `http://localhost:8000/api/v1/*` → `http://localhost:8080/api/v1/*`

### Authentication
JWT authentication remains unchanged - the gateway proxies authentication headers to the backend service.

## Future Enhancements

1. **API Gateway Features**
   - Request/response transformation
   - Protocol translation (HTTP/2, gRPC)
   - Load balancing algorithms
   - Service discovery integration

2. **Security**
   - Web Application Firewall (WAF)
   - DDoS protection
   - API authentication gateway
   - Request validation schemas

3. **Observability**
   - Distributed tracing integration
   - Advanced metrics collection
   - Real-time monitoring dashboards
   - Alerting and notifications

4. **Performance**
   - Response caching
   - Request compression
   - Connection pooling
   - Edge deployment

## Support

For issues or questions about gateway routing:
- Check gateway logs for routing decisions
- Verify upstream service health
- Review environment configuration
- Consult the main API documentation