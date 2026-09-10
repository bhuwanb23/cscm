# CSCM API Integration Guide

## Overview

This guide provides comprehensive instructions for integrating with the Cognitive Supply Chain Mesh (CSCM) API. The CSCM API provides endpoints for supply chain management, demand forecasting, inventory optimization, and AI/ML-powered decision support.

## Quick Start

### Base URLs
- **Development**: `http://localhost:8080/api/v1`
- **Production**: `https://api.cscm.example.com/api/v1`
- **API Documentation**: `http://localhost:8080/api-docs` (Backend)
- **AI/ML Documentation**: `http://localhost:8000/docs` (AI/ML Service)

### Authentication
The CSCM API uses JWT (JSON Web Token) authentication. Include your token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## Authentication Flow

### 1. Register a New User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "johndoe",
      "email": "john@example.com",
      "role": "user"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Access Protected Endpoints
```http
GET /api/v1/auth/profile
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Inventory Management

#### Get All Inventory for a Store
```http
GET /api/v1/inventory/store/:storeId
Authorization: Bearer <token>
```

**Example**:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/inventory/store/1
```

#### Get Specific Inventory Item
```http
GET /api/v1/inventory/store/:storeId/product/:productId
Authorization: Bearer <token>
```

#### Create/Update Inventory
```http
PUT /api/v1/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "SKU-001",
  "storeId": "1",
  "quantity": 100,
  "reserved_quantity": 10,
  "min_stock_level": 20,
  "max_stock_level": 500,
  "unit_cost": 25.50,
  "selling_price": 45.00
}
```

#### Update Inventory Quantity
```http
PATCH /api/v1/inventory/store/:storeId/product/:productId/quantity
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 150
}
```

### Order Management

#### Create Order
```http
POST /api/v1/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "order_id": "ORD-001",
  "store_id": "1",
  "customer_id": "CUST-001",
  "total_amount": 250.00,
  "status": "pending",
  "items": [
    {
      "productId": "SKU-001",
      "quantity": 5,
      "price": 45.00
    }
  ]
}
```

#### Get Order by ID
```http
GET /api/v1/orders/:orderId
Authorization: Bearer <token>
```

#### Update Order Status
```http
PATCH /api/v1/orders/:orderId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "shipped"
}
```

#### Get Orders by Store
```http
GET /api/v1/orders/store/:storeId?status=pending
Authorization: Bearer <token>
```

### Shipment Management

#### Create Shipment
```http
POST /api/v1/shipments
Authorization: Bearer <token>
Content-Type: application/json

{
  "shipment_id": "SHP-001",
  "order_id": "ORD-001",
  "from_location": "WAREHOUSE-A",
  "to_location": "STORE-1",
  "status": "pending",
  "carrier": "FedEx",
  "tracking_number": "1234567890",
  "estimated_delivery": "2026-09-15T00:00:00Z",
  "items": [
    {
      "productId": "SKU-001",
      "quantity": 5
    }
  ]
}
```

#### Get Shipment by ID
```http
GET /api/v1/shipments/:shipmentId
Authorization: Bearer <token>
```

#### Update Shipment Status
```http
PATCH /api/v1/shipments/:shipmentId/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "in_transit",
  "actual_delivery": "2026-09-14T15:30:00Z"
}
```

#### Get Shipments by Status
```http
GET /api/v1/shipments/status/:status
Authorization: Bearer <token>
```

#### Get Shipments by Location
```http
GET /api/v1/shipments/location/:location
Authorization: Bearer <token>
```

## AI/ML Service Integration

### Demand Forecasting

#### Generate Demand Forecast
```http
POST /api/v1/demand/forecast
Content-Type: application/json

{
  "sku_id": "SKU-001",
  "store_id": "1",
  "forecast_horizon": 7,
  "include_confidence_intervals": true
}
```

**Response**:
```json
{
  "sku_id": "SKU-001",
  "store_id": "1",
  "forecast_dates": ["2026-09-11", "2026-09-12", "2026-09-13", "2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17"],
  "forecast_values": [120, 115, 110, 108, 105, 102, 100],
  "confidence_intervals": [
    {"lower": 110, "upper": 130},
    {"lower": 105, "upper": 125},
    {"lower": 100, "upper": 120},
    {"lower": 98, "upper": 118},
    {"lower": 95, "upper": 115},
    {"lower": 92, "upper": 112},
    {"lower": 90, "upper": 110}
  ],
  "model_version": "demand_forecaster_rf_v2",
  "timestamp": "2026-09-10T14:25:00Z"
}
```

#### Get Demand Metrics
```http
GET /api/v1/demand/metrics/{sku_id}/{store_id}?start_date=2026-08-01&end_date=2026-09-10
```

**Response**:
```json
{
  "sku_id": "SKU-001",
  "store_id": "1",
  "mape": 0.15,
  "smape": 0.14,
  "mae": 12.5,
  "rmse": 15.2,
  "crps": 2.3,
  "timestamp": "2026-09-10T14:25:00Z"
}
```

### Inventory Optimization

#### Optimize Inventory Levels
```http
POST /api/v1/inventory/optimize
Content-Type: application/json

{
  "store_id": "1",
  "products": [
    {
      "product_id": "SKU-001",
      "current_stock": 100,
      "demand_forecast": [120, 115, 110, 108, 105],
      "lead_time": 7,
      "holding_cost": 0.25
    }
  ]
}
```

#### Get Inventory Recommendations
```http
POST /api/v1/inventory/recommendation
Content-Type: application/json

{
  "store_id": "1",
  "optimization_goal": "cost_minimization"
}
```

### Routing & Logistics

#### Optimize Delivery Routes
```http
POST /api/v1/routing/optimize
Content-Type: application/json

{
  "origin": "WAREHOUSE-A",
  "destinations": [
    {
      "location": "STORE-1",
      "demand": 50,
      "time_window": "09:00-17:00"
    }
  ],
  "fleet": [
    {
      "vehicle_id": "VH-001",
      "capacity": 1000,
      "current_location": "WAREHOUSE-A"
    }
  ]
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Default limit**: 100 requests per 15 minutes per IP
- **Headers**: Check `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**Rate Limit Exceeded Response**:
```json
{
  "success": false,
  "error": "Too many requests, please try again later."
}
```

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common HTTP Status Codes
- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required or invalid
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **502 Bad Gateway**: Upstream service unavailable
- **504 Gateway Timeout**: Upstream service timeout

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:8080/api/v1';
const API_KEY = 'your-jwt-token';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Register user
async function registerUser(username, email, password) {
  try {
    const response = await api.post('/auth/register', {
      username,
      email,
      password
    });
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error.response.data);
    throw error;
  }
}

// Get inventory
async function getInventory(storeId) {
  try {
    const response = await api.get(`/inventory/store/${storeId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to get inventory:', error.response.data);
    throw error;
  }
}

// Create order
async function createOrder(orderData) {
  try {
    const response = await api.post('/orders', orderData);
    return response.data;
  } catch (error) {
    console.error('Failed to create order:', error.response.data);
    throw error;
  }
}

// Get demand forecast
async function getDemandForecast(skuId, storeId, horizon = 7) {
  try {
    const response = await api.post('/demand/forecast', {
      sku_id,
      store_id,
      forecast_horizon: horizon,
      include_confidence_intervals: true
    });
    return response.data;
  } catch (error) {
    console.error('Failed to get demand forecast:', error.response.data);
    throw error;
  }
}
```

### Python

```python
import requests
import json

# Configuration
API_BASE_URL = 'http://localhost:8080/api/v1'
API_KEY = 'your-jwt-token'

# Create session
session = requests.Session()
session.headers.update({
    'Authorization': f'Bearer {API_KEY}',
    'Content-Type': 'application/json'
})

# Register user
def register_user(username, email, password):
    url = f'{API_BASE_URL}/auth/register'
    data = {
        'username': username,
        'email': email,
        'password': password
    }
    response = session.post(url, json=data)
    response.raise_for_status()
    return response.json()

# Get inventory
def get_inventory(store_id):
    url = f'{API_BASE_URL}/inventory/store/{store_id}'
    response = session.get(url)
    response.raise_for_status()
    return response.json()

# Create order
def create_order(order_data):
    url = f'{API_BASE_URL}/orders'
    response = session.post(url, json=order_data)
    response.raise_for_status()
    return response.json()

# Get demand forecast
def get_demand_forecast(sku_id, store_id, horizon=7):
    url = f'{API_BASE_URL}/demand/forecast'
    data = {
        'sku_id': sku_id,
        'store_id': store_id,
        'forecast_horizon': horizon,
        'include_confidence_intervals': True
    }
    response = session.post(url, json=data)
    response.raise_for_status()
    return response.json()
```

### cURL

```bash
# Register user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "password": "securePassword123"
  }'

# Get inventory
curl -X GET http://localhost:8080/api/v1/inventory/store/1 \
  -H "Authorization: Bearer <your-jwt-token>"

# Create order
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "ORD-001",
    "store_id": "1",
    "customer_id": "CUST-001",
    "total_amount": 250.00,
    "status": "pending",
    "items": [
      {
        "productId": "SKU-001",
        "quantity": 5,
        "price": 45.00
      }
    ]
  }'

# Get demand forecast
curl -X POST http://localhost:8080/api/v1/demand/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "sku_id": "SKU-001",
    "store_id": "1",
    "forecast_horizon": 7,
    "include_confidence_intervals": true
  }'
```

## Webhooks and Events

### Event Publishing
```http
POST /api/v1/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventType": "inventory_update",
  "source": "external_system",
  "data": {
    "storeId": "1",
    "productId": "SKU-001",
    "quantity": 150,
    "timestamp": "2026-09-10T14:25:00Z"
  }
}
```

## Best Practices

### 1. Authentication
- Always include JWT token in Authorization header
- Store tokens securely (use secure storage for mobile apps)
- Implement token refresh logic before expiration
- Never log or expose tokens

### 2. Error Handling
- Implement retry logic for transient failures (5xx errors)
- Use exponential backoff for retries
- Handle rate limit responses gracefully
- Log errors for debugging

### 3. Request Validation
- Validate request data before sending
- Use proper data types (numbers for quantities, strings for IDs)
- Check required fields are present
- Handle empty or null values appropriately

### 4. Performance
- Use batch endpoints when available
- Implement caching for frequently accessed data
- Use pagination for large result sets
- Consider async processing for long-running operations

### 5. Security
- Use HTTPS in production
- Validate and sanitize all input data
- Implement proper CORS configuration
- Don't expose sensitive data in logs
- Use environment variables for API keys

## Testing Your Integration

### Test Environment
Use the development environment for testing:
- **Gateway**: `http://localhost:8080`
- **Backend**: `http://localhost:3000`
- **AI/ML**: `http://localhost:8000`

### Test Endpoints
```bash
# Health check
curl http://localhost:8080/health

# Gateway health
curl http://localhost:8080/health/python

# API documentation
open http://localhost:8080/api-docs
```

### Test Authentication Flow
1. Register a test user
2. Login to get JWT token
3. Access protected endpoint with token
4. Verify token expiration handling

## Troubleshooting

### Connection Issues
1. Verify gateway is running: `curl http://localhost:8080/health`
2. Check backend service status: `curl http://localhost:3000/health`
3. Check AI/ML service status: `curl http://localhost:8000/health`
4. Verify network connectivity

### Authentication Issues
1. Verify token is valid and not expired
2. Check token format (Bearer <token>)
3. Verify user credentials are correct
4. Check user role has required permissions

### Routing Issues
1. Check if upstream services are accessible
2. Verify DNS names in Docker/Kubernetes environments
3. Review gateway logs for routing decisions
4. Check path formatting matches expected patterns

### Rate Limiting
1. Monitor rate limit headers in responses
2. Implement backoff in your client
3. Use batch operations to reduce request count
4. Contact support for higher limits if needed

## Support and Resources

### Documentation
- **API Documentation**: `http://localhost:8080/api-docs`
- **AI/ML Documentation**: `http://localhost:8000/docs`
- **Gateway Routing**: See `docs/GATEWAY_ROUTING.md`

### Support
- **Email**: support@cscm.example.com
- **Documentation**: `docs/API_INTEGRATION_GUIDE.md`
- **GitHub Issues**: Report bugs and feature requests

### Changelog
- **v1.0.0**: Initial API release with core endpoints
- **v1.1.0**: Added AI/ML service integration
- **v1.2.0**: Enhanced error handling and validation

## SDKs and Libraries

Official SDKs are not currently available, but the API is RESTful and can be easily integrated with any HTTP client library.

### Recommended Libraries
- **JavaScript**: Axios, Fetch API
- **Python**: Requests, HTTPX
- **Java**: OkHttp, Retrofit
- **C#**: HttpClient, RestSharp
- **Go**: net/http

## Migration from Previous Versions

### API Versioning
The API uses path-based versioning: `/api/v1/`
- **v1**: Current stable version
- **v2**: Future versions (not yet released)

### Breaking Changes
- Authentication now requires JWT tokens
- Response format has been standardized
- Some endpoint paths have changed
- Error response format has been updated

## Appendix

### HTTP Status Codes Reference
- **2xx**: Success
- **4xx**: Client errors
- **5xx**: Server errors

### Error Codes
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Insufficient permissions
- `INV_001`: Inventory not found
- `INV_002`: Invalid inventory data
- `ORD_001`: Order not found
- `ORD_002`: Invalid order status
- `SHP_001`: Shipment not found
- `SHP_002`: Invalid shipment status
- `RATE_001`: Rate limit exceeded

### Data Models
See the API documentation (`/api-docs`) for complete data model schemas and validation rules.