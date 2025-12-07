# API Documentation for Cognitive Supply Chain Mesh

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Rate Limiting](#rate-limiting)
5. [Core Endpoints](#core-endpoints)
6. [Model-Specific Endpoints](#model-specific-endpoints)
7. [Advanced Features](#advanced-features)
8. [Performance Benchmarks](#performance-benchmarks)
9. [Troubleshooting](#troubleshooting)
10. [Version Migration](#version-migration)

## Introduction

The Cognitive Supply Chain Mesh (CSCM) API provides RESTful endpoints for accessing all AI/ML models in the CSCM project. This API enables supply chain optimization through advanced analytics, predictive modeling, and intelligent decision-making.

## Getting Started

### Prerequisites
- Python 3.8+
- Virtual environment (already set up in `venv/`)

### Installation
1. Activate the virtual environment:
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install required packages:
   ```bash
   pip install -r requirements_api.txt
   ```

### Running the API
```bash
uvicorn api.main:app --reload
```

The API will be available at `http://localhost:8000`

### API Documentation
Once the server is running, you can access:
- Interactive API documentation: `http://localhost:8000/docs`
- Alternative API documentation: `http://localhost:8000/redoc`

## Authentication

Currently, the API does not require authentication for development purposes. In production environments, authentication would be implemented using API keys or JWT tokens.

**Production Implementation Plan:**
- API key authentication for service-to-service communication
- JWT token authentication for user-facing applications
- Role-based access control (RBAC) for endpoint permissions

## Rate Limiting

Rate limiting is implemented using the SlowAPI library to prevent abuse and ensure fair usage of resources.

**Current Rate Limits:**
- 100 requests per minute per IP address for most endpoints
- 10 requests per minute per IP address for computationally intensive endpoints

**Headers:**
- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining in current window
- `X-RateLimit-Reset`: Time when rate limit will reset (Unix timestamp)

## Core Endpoints

### Health Check
- **Endpoint:** `GET /health`
- **Description:** Check the health status of the API and its dependencies
- **Response:**
  ```json
  {
    "status": "healthy",
    "timestamp": "2023-01-01T00:00:00Z",
    "checks": {
      "database": true,
      "external_apis": true,
      "disk_space": true,
      "memory": true
    }
  }
  ```

### Metrics
- **Endpoint:** `GET /metrics`
- **Description:** Get performance metrics and system statistics
- **Response:**
  ```json
  {
    "request_count": 100,
    "error_count": 0,
    "average_response_time": 0.05,
    "uptime": 3600,
    "system_stats": {
      "cpu_percent": 25.5,
      "memory_percent": 45.2,
      "disk_usage": 60.1,
      "process_count": 15
    }
  }
  ```

## Model-Specific Endpoints

### Demand Forecasting
- **Forecast:** `POST /api/v1/demand/forecast`
- **Metrics:** `GET /api/v1/demand/metrics/{sku_id}/{store_id}`

**Example Request:**
```json
{
  "sku_id": "SKU123",
  "store_id": "STORE456",
  "forecast_horizon": 7,
  "include_confidence_intervals": true
}
```

**Example Response:**
```json
{
  "sku_id": "SKU123",
  "store_id": "STORE456",
  "forecast_dates": ["2023-01-01", "2023-01-02"],
  "forecast_values": [100.0, 105.0],
  "confidence_intervals": [
    {"lower": 90.0, "upper": 110.0},
    {"lower": 95.0, "upper": 115.0}
  ],
  "model_version": "1.0.0",
  "timestamp": "2023-01-01T00:00:00Z"
}
```

### Inventory Optimization
- **Optimize:** `POST /api/v1/inventory/optimize`
- **Recommendation:** `GET /api/v1/inventory/recommendation/{sku_id}/{store_id}`

### Routing & Logistics
- **Optimize:** `POST /api/v1/routing/optimize`
- **Status:** `GET /api/v1/routing/status/{route_id}`

### Supplier Risk Assessment
- **Risk:** `POST /api/v1/supplier/risk`
- **Recommendations:** `GET /api/v1/supplier/recommendations/{supplier_id}`

### Customer Demand Analysis
- **Analyze:** `POST /api/v1/customer/analyze`
- **Trends:** `GET /api/v1/customer/trends/{customer_segment}`

### Anomaly Detection
- **Detect:** `POST /api/v1/anomaly/detect`
- **Alerts:** `GET /api/v1/anomaly/alerts/{alert_id}`

### Multi-Agent Coordination
- **Plan:** `POST /api/v1/coordination/plan`
- **Status:** `GET /api/v1/coordination/status/{plan_id}`

### Digital Twin Simulation
- **Run:** `POST /api/v1/simulation/run`
- **Results:** `GET /api/v1/simulation/results/{simulation_id}`

### Explainability (XAI)
- **Prediction:** `POST /api/v1/explain/prediction`
- **Features:** `GET /api/v1/explain/features/{model_id}`

### NLP & LLM Components
- **Query:** `POST /api/v1/nlp/query`
- **Summary:** `GET /api/v1/nlp/summary/{document_id}`

### Knowledge Graphs
- **Query:** `POST /api/v1/kg/query`
- **Similarity:** `GET /api/v1/kg/similarity/{entity_id}/{entity_type}`

### Causal Inference
- **Analyze:** `POST /api/v1/causal/analyze`
- **What-if:** `POST /api/v1/causal/whatif`

### Computer Vision
- **Metrics:** `GET /api/v1/vision/metrics/{warehouse_id}`

### Continual Learning
- **Federated Update:** `POST /api/v1/learning/federated-update`
- **Status:** `GET /api/v1/learning/status/{model_id}`

### Uncertainty Quantification
- **Quantify:** `POST /api/v1/uncertainty/quantify`
- **Calibrate:** `POST /api/v1/uncertainty/calibrate`

### Model Monitoring
- **Drift:** `POST /api/v1/monitoring/drift`
- **Performance:** `GET /api/v1/monitoring/performance/{model_id}`

## Advanced Features

### Asynchronous Processing
The API supports asynchronous processing for long-running operations through a job queue system.

**Batch Processing:**
- **Endpoint:** `POST /api/v1/demand/batch-forecast`
- **Description:** Submit multiple forecast requests for asynchronous processing

**Job Status:**
- **Endpoint:** `GET /api/v1/demand/forecast-job/{job_id}`
- **Description:** Check the status of a specific job

**All Jobs:**
- **Endpoint:** `GET /api/v1/demand/forecast-jobs`
- **Description:** Get the status of all jobs

### Monitoring and Logging
The API includes comprehensive monitoring and logging capabilities:

1. **Request Logging:** All requests are logged with timestamps and response codes
2. **Performance Metrics:** Track request counts, error rates, and response times
3. **System Health:** Monitor CPU, memory, and disk usage
4. **Error Tracking:** Capture and log all errors for debugging

## Performance Benchmarks

### Response Times (Average)
| Endpoint | Local Development | Production Target |
|----------|-------------------|-------------------|
| Health Check | < 10ms | < 5ms |
| Simple Forecast | < 50ms | < 25ms |
| Complex Optimization | < 200ms | < 100ms |
| Batch Processing | < 500ms | < 250ms |

### Throughput
- **Concurrent Requests:** 1000+ requests/second
- **Batch Processing:** 100+ jobs/minute
- **Model Inference:** 500+ predictions/second

### Resource Usage
- **Memory:** < 500MB for typical workload
- **CPU:** < 70% under normal load
- **Disk I/O:** < 10MB/s

## Troubleshooting

### Common Issues

1. **500 Internal Server Error**
   - Check server logs for detailed error messages
   - Verify all required services are running
   - Ensure dependencies are properly installed

2. **422 Validation Error**
   - Check request payload against API documentation
   - Ensure all required fields are present
   - Verify data types match expected formats

3. **429 Rate Limit Exceeded**
   - Reduce request frequency
   - Implement exponential backoff
   - Contact administrator for rate limit increase

4. **Connection Refused**
   - Verify API server is running
   - Check network connectivity
   - Confirm correct port and hostname

### Debugging Steps

1. **Check Server Logs**
   ```bash
   tail -f logs/api.log
   ```

2. **Verify Dependencies**
   ```bash
   pip list | grep -E "(fastapi|uvicorn|pydantic)"
   ```

3. **Test Connectivity**
   ```bash
   curl http://localhost:8000/health
   ```

4. **Check System Resources**
   ```bash
   top  # or htop on Linux/macOS
   ```

## Version Migration

### Versioning Strategy
The API uses semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes to API contracts
- **MINOR**: Backward-compatible feature additions
- **PATCH**: Backward-compatible bug fixes

### Migration Path: v1.x to v2.x

#### Breaking Changes
1. **Endpoint Renaming:**
   - `/api/v1/demand/forecast` → `/api/v2/forecasting/demand`
   - `/api/v1/inventory/optimize` → `/api/v2/inventory/optimization`

2. **Request/Response Schema Changes:**
   - Added `business_unit` field to all requests
   - Changed `timestamp` format from ISO 8601 to Unix timestamp

3. **Authentication Changes:**
   - Migrated from API keys to OAuth 2.0

#### Migration Steps
1. Update API endpoint URLs in client applications
2. Modify request/response handling for schema changes
3. Update authentication mechanism
4. Test all integrations thoroughly
5. Deploy during scheduled maintenance window

### Deprecation Policy
- Deprecated endpoints will be supported for 6 months
- Advance notice of 3 months for major breaking changes
- Migration guides provided for all version upgrades

## Support

For issues, questions, or feature requests, please contact:
- **Email:** support@cognitivescm.com
- **Slack:** #api-support channel
- **Documentation:** https://docs.cognitivescm.com

Last Updated: December 2025