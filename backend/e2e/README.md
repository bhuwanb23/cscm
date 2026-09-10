# E2E Testing Framework Documentation

## Overview
The CSCM E2E (End-to-End) testing framework provides comprehensive testing of the complete supply chain system by simulating real user workflows across all roles (Shopkeeper, Transporter, Wholesaler, Mesh Console) and validating the complete data flow through the mobile app, API gateway, backend, and AI/ML services.

## Architecture

### Components
- **Sub-Agent Base Class**: Base class for all role-specific test agents
- **Role-Specific Sub-Agents**: Shopkeeper, Transporter, Wholesaler, Mesh Console
- **API Client**: HTTP client for making requests to gateway, backend, and AI/ML services
- **Test Configuration**: Centralized configuration for all test settings
- **Test Data Fixtures**: Consistent test data for reproducible tests
- **E2E Test Runner**: Orchestrates all tests and generates reports

### Test Flow
```
Sub-Agent → API Client → Gateway → Backend/AI-ML → Validation → Reporting
```

## Directory Structure

```
backend/e2e/
├── config/
│   ├── test-config.js          # Test configuration
│   ├── api-client.js           # HTTP client for tests
│   └── test-data.js            # Test data fixtures
├── utils/
│   ├── sub-agent-base.js       # Base sub-agent class
│   ├── shopkeeper-sub-agent.js  # Shopkeeper sub-agent
│   ├── transporter-sub-agent.js # Transporter sub-agent
│   ├── wholesaler-sub-agent.js  # Wholesaler sub-agent
│   └── mesh-sub-agent.js        # Mesh console sub-agent
├── shopkeeper/                 # Shopkeeper-specific tests (future)
├── transporter/                 # Transporter-specific tests (future)
├── wholesaler/                  # Wholesaler-specific tests (future)
├── mesh/                        # Mesh console tests (future)
├── integration/                 # Cross-role integration tests (future)
└── e2e-runner.js               # Main test runner
```

## Running Tests

### Prerequisites
Ensure all services are running:
- API Gateway: `http://localhost:8080`
- Backend API: `http://localhost:3000`
- AI/ML Service: `http://localhost:8000`
- Redis: `localhost:6379`

### Run All E2E Tests
```bash
cd backend
npm run test:e2e
```

### Run Specific Sub-Agent Tests
```bash
# Run only shopkeeper tests
node e2e/utils/shopkeeper-sub-agent.js

# Run only transporter tests
node e2e/utils/transporter-sub-agent.js

# Run only wholesaler tests
node e2e/utils/wholesaler-sub-agent.js

# Run only mesh console tests
node e2e/utils/mesh-sub-agent.js
```

## Test Coverage

### Shopkeeper Tests (5 workflows)
1. **Dashboard**: Data aggregation, KPIs, demand forecasts, anomaly alerts
2. **Inventory Management**: CRUD operations, AI recommendations, optimization
3. **Order Placement**: Order creation, tracking, status updates, shipment integration
4. **Shipment Tracking**: Delivery tracking, confirmation, inventory updates
5. **Analysis Dashboard**: AI-powered analytics, ML insights, model explainability

### Transporter Tests (4 workflows)
1. **Dashboard**: Active deliveries, quick stats, alerts
2. **Task Management**: Delivery list, filtering, completion, optimistic updates
3. **Navigation**: Route planning, ETA calculation, GNN routing
4. **Profile**: Driver profile, vehicle stats, performance metrics

### Wholesaler Tests (4 workflows)
1. **Dashboard**: Order summaries, inventory overview, supplier recommendations
2. **Inventory Management**: Multi-warehouse tracking, batch optimization
3. **Order Management**: Purchase orders, order history, supplier integration
4. **Shipment Tracking**: In-transit monitoring, warehouse assignment

### Mesh Console Tests (4 workflows)
1. **Alerts**: Centralized anomaly alerts, filtering, acknowledgment
2. **Knowledge Graph**: Entity relationships, graph queries, path exploration
3. **Drift Monitoring**: Model drift detection, performance monitoring
4. **Network Topology**: Supply chain visualization, network simulation

### Integration Tests (3 workflows)
1. **Order-to-Delivery**: Complete order lifecycle across all roles
2. **Demand Forecasting**: Forecast coordination across supply chain
3. **Anomaly Detection**: Detection and response workflow

## API Endpoints Tested

### Authentication
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/profile`

### Inventory
- `GET /api/v1/inventory/{storeId}`
- `GET /api/v1/inventory/{storeId}/{productId}`
- `POST /api/v1/inventory`
- `PUT /api/v1/inventory/{storeId}/{productId}/quantity`

### Orders
- `POST /api/v1/orders`
- `GET /api/v1/orders/{orderId}`
- `PATCH /api/v1/orders/{orderId}/status`
- `GET /api/v1/orders/store/{storeId}`

### Shipments
- `POST /api/v1/shipments`
- `GET /api/v1/shipments/{shipmentId}`
- `PATCH /api/v1/shipments/{shipmentId}/status`
- `GET /api/v1/shipments/status/{status}`
- `GET /api/v1/shipments/location/{location}`

### AI/ML Services
- `POST /api/v1/demand/forecast`
- `POST /api/v1/demand/batch-forecast`
- `POST /api/v1/inventory/optimize`
- `POST /api/v1/inventory/batch-optimize`
- `POST /api/v1/routing/optimize`
- `POST /api/v1/routing/eta`
- `POST /api/v1/routing/travel-time`
- `POST /api/v1/routing/gnn-route`
- `GET /api/v1/routing/status/{routeId}`
- `POST /api/v1/supplier/risk`
- `GET /api/v1/supplier/recommendations/{supplierId}`
- `POST /api/v1/anomaly/detect`
- `GET /api/v1/anomaly/alerts`
- `POST /api/v1/anomaly/alerts/{alertId}/acknowledge`
- `POST /api/v1/kg/query`
- `POST /api/v1/explain/forecast`
- `POST /api/v1/monitoring/drift`
- `POST /api/v1/simulation/network-sim`
- `POST /api/v1/simulation/discrete-event-sim`
- `POST /api/v1/simulation/policy-impact`
- `POST /api/v1/coordination/plan`

## AI/ML Sub-Agent Integration

The E2E tests validate the following AI/ML sub-agents:

### Store Agent
- **DemandForecaster**: Demand prediction models
- **InventoryOptimizer**: Inventory optimization algorithms
- **StockRecommender**: Reorder quantity recommendations
- **ContinualLearner**: Model update mechanisms

### Warehouse Agent
- **BatchOptimizer**: Batch inventory optimization
- **PackingPlanner**: Packing optimization
- **PickingOptimizer**: Picking route optimization
- **ShipmentConsolidator**: Shipment consolidation logic
- **VisionInspector**: Computer vision for inventory inspection

### Transport Agent
- **DeliveryScheduler**: Delivery scheduling
- **EdgeDeployer**: Edge model deployment
- **FleetManager**: Fleet management
- **RouteOptimizer**: Route optimization algorithms
- **RouteTracker**: Route tracking and monitoring

### Supplier Agent
- **BackupSupplierFinder**: Backup supplier identification
- **PerformanceTracker**: Supplier performance tracking
- **RiskAssessor**: Supplier risk assessment
- **RiskMetricsAnalyzer**: Risk metrics analysis
- **SourcingAdvisor**: Sourcing recommendations
- **SupplierCalibrator**: Supplier calibration

### Central Planner Agent
- **AnomalyAlerter**: Anomaly detection and alerting
- **DeliveryCoordinator**: Delivery coordination
- **DriftDetector**: Model drift detection
- **KnowledgeGraphQuerier**: Knowledge graph queries
- **UncertaintyQuantifier**: Uncertainty quantification
- **WarehouseAssigner**: Warehouse assignment logic

## Test Data

### Test Fixtures
The framework uses consistent test data fixtures defined in `config/test-data.js`:
- Shopkeepers: 2 test shopkeepers
- Transporters: 2 test transporters
- Wholesalers: 1 test wholesaler
- Warehouses: 2 test warehouses
- Inventory: 4 test inventory items
- Orders: 2 test orders
- Shipments: 2 test shipments
- Suppliers: 2 test suppliers

### Data Isolation
- Each test uses test-specific IDs (prefixed with `TEST_`)
- Test data is isolated from production data
- Cleanup operations reset data after each test
- Support for parallel test execution with unique IDs

## Performance Metrics

### Collected Metrics
- Response times for all API calls
- Error rates and failure counts
- AI/ML service latency
- Test execution duration
- P95 response time
- Average response time

### Performance Thresholds
- P95 response time < 200ms
- Error rate < 0.1%
- AI/ML prediction latency < 500ms
- Total test execution < 10 minutes

## Error Handling

### Retry Logic
- Automatic retry for failed requests (max 3 attempts)
- Exponential backoff for retries
- Detailed error logging

### Validation
- Response structure validation
- Required field validation
- Status code validation
- Data type validation

## Troubleshooting

### Common Issues

**Service Health Check Fails**
- Ensure all services are running
- Check service ports: Gateway 8080, Backend 3000, AI/ML 8000
- Check service logs for errors

**Test Data Not Found**
- Ensure test database is initialized
- Check seed data scripts
- Verify test fixtures are correct

**AI/ML Service Timeouts**
- Check AI/ML service is healthy
- Verify model loading is complete
- Check for GPU/memory constraints

**Authentication Failures**
- Verify auth test data is correct
- Check JWT token generation
- Verify user permissions

## Continuous Integration

### GitHub Actions Integration
To integrate with CI/CD:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd backend
          npm install
      - name: Start services
        run: |
          docker-compose up -d
      - name: Run E2E tests
        run: |
          cd backend
          npm run test:e2e
      - name: Stop services
        run: |
          docker-compose down
```

## Future Enhancements

### Planned Features
- Mobile app UI testing with Detox/Appium
- Performance and load testing with k6
- Visual regression testing
- API contract testing with Swagger/OpenAPI
- Browser-based testing with Playwright
- Database state validation
- Redis message queue testing
- Kafka event stream testing

### Additional Test Scenarios
- Concurrent user simulation
- Network failure simulation
- Service unavailability testing
- Rate limiting validation
- Security testing
- Accessibility testing

## Support

For issues or questions about the E2E testing framework, contact the CSCM development team or refer to the main project documentation.
