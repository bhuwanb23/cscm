# CSCM Architecture Documentation

## Overview

The Cognitive Supply Chain Mesh (CSCM) is a multi-tier supply chain intelligence platform consisting of a React Native mobile application, Node.js API gateway, Express backend API, Python AI/ML service, and supporting infrastructure.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Mobile App (Expo)                        │
│   Shopkeeper · Transporter · Wholesaler · Mesh Console     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │               src/api/ (fetch wrapper)                 │  │
│  └───────────────────┬───────────────────────────────────┘  │
└──────────────────────┼──────────────────────────────────────┘
                       │ :8080
┌──────────────────────▼──────────────────────────────────────┐
│                 API Gateway (Express)                       │
│  ┌────────────────────┴──────────────────────┐            │
│  │  /api/v1/* → Backend (Port 3000)         │            │
│  │  AI/ML domains → Python (Port 8000)      │            │
│  └────────────────────┬──────────────────────┘            │
└───────────────────────┼─────────────────────────────────────┘
                        │
           ┌────────────┴────────────┐
           ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│  Backend (Express)│      │  Python AI/ML     │
│  Port: 3000       │      │  Port: 8000       │
│  • REST API       │      │  • FastAPI        │
│  • SQLite DB      │      │  • 17 Routers     │
│  • JWT Auth       │      │  • 31 Sub-agents  │
│  • Redis Client   │      │  • Legacy Models │
└─────────┬──────────┘      └──────────────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌──────┐   ┌──────┐
│Redis │   │SQLite│
│:6379 │   │ DB   │
└──────┘   └──────┘
```

## Component Architecture

### 1. Mobile Application (React Native/Expo)

**Technology Stack**:
- React Native 0.81
- Expo SDK 54
- React Native Paper 5.14

**Roles**:
- Shopkeeper: Inventory management, stock monitoring, shipments
- Transporter: Task management, navigation, route optimization
- Wholesaler: Order management, inventory, shipments
- Mesh Console: Alerts, knowledge graph, drift monitoring, network visualization

**Architecture**:
- Component-based UI with React Native Paper
- Centralized API client in `src/api/`
- Custom hooks for data fetching and state management
- Role-based navigation and screens

### 2. API Gateway (Express.js)

**Purpose**: Single entry point for all API requests, routing between backend and AI/ML services

**Key Features**:
- Domain-based routing logic
- Health check endpoints
- Proxy error handling
- Request/response logging

**Routing Logic**:
- AI/ML domains: demand, demand-planning, routing, supplier, customer, anomaly, coordination, simulation, explain, nlp, kg, causal, vision, learning, uncertainty, monitoring
- Backend domains: auth, events, inventory, orders, shipments
- Special inventory routing for AI/ML actions: optimize, recommendation, ss-policy, stochastic-optimize, rl-train, mip-optimize, batch-optimize

**Configuration**:
- Port: 8080 (configurable via GATEWAY_PORT)
- AI/ML upstream: http://localhost:8000 (configurable via AI_ML_API_URL)
- CORS: Currently wildcard (should be restricted in production)

### 3. Backend API (Express.js)

**Purpose**: CRUD operations, authentication, events, inventory, orders, shipments management

**Key Components**:
- **API Controllers**: auth, events, inventory, orders, shipments
- **Middleware**: error handling, rate limiting, security headers
- **Services**: Base API service, resilience patterns
- **Storage**: SQLite database with support for Redis messaging
- **Agents**: Supply chain agents for stores, warehouses, transport, suppliers
- **Knowledge Graph**: Local knowledge graph implementation

**Authentication**:
- JWT-based authentication
- Token generation and validation
- Role-based access control (admin, user, guest)
- Default JWT secret: cscm-secret-key (should be changed in production)

**Resilience Patterns** (NEW):
- **Circuit Breakers**: Protects against AI/ML, Redis, and Database failures
- **Retry Logic**: Exponential backoff with jitter for transient failures
- **Graceful Degradation**: Service degradation levels (full, partial, minimal, critical)
- **Fallback Handlers**: Cached responses and default values when services unavailable
- **Auto-Recovery**: Periodic health checks and automatic service recovery

**Rate Limiting** (NEW):
- **Tiered Rate Limits**: anonymous (100/15min), user (500/15min), premium (2000/15min), admin (5000/15min), internal (10000/15min)
- **Redis-based**: Distributed rate limiting with in-memory fallback
- **Rate Limit Headers**: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset

**Monitoring**:
- Prometheus metrics integration
- Winston logging with file and console transports
- Health check endpoints
- Circuit breaker state monitoring
- Retry metrics tracking

### 4. AI/ML Service (Python FastAPI)

**Purpose**: AI/ML-powered supply chain optimization and analysis

**Technology Stack**:
- Python 3.11+
- FastAPI
- PyTorch, Scikit-learn, XGBoost
- 17 domain-specific routers
- 31 sub-agents for specialized tasks

**Routers**:
- demand_forecasting: Demand prediction and metrics
- demand_planning: Demand planning optimization
- inventory_optimization: Inventory level optimization
- routing_logistics: Route optimization and delivery scheduling
- supplier_risk: Supplier risk assessment
- customer_demand: Customer demand analysis
- anomaly_detection: Anomaly detection in supply chain data
- multi_agent_coordination: Multi-agent system coordination
- digital_twin: Digital twin simulation
- explainability: XAI for model explanations
- nlp: Natural language processing
- knowledge_graph: Knowledge graph operations
- causal_inference: Causal relationship discovery
- computer_vision: Computer vision for supply chain
- continual_learning: Online model learning
- uncertainty_quantification: Prediction uncertainty estimation
- model_monitoring: Model performance monitoring

**Features**:
- Built-in OpenAPI/Swagger documentation at /docs
- Job queue for async processing
- Model registry for model management
- Monitoring and metrics collection
- Error handling and fallback responses

### 5. Data Layer

**SQLite Database**:
- Tables: inventory, orders, order_items, shipments, users, events
- Foreign key constraints
- Timestamp tracking
- Local file-based storage for development

**Redis**:
- Message passing between services
- Pub/sub for event-driven architecture
- Optional integration for caching and rate limiting
- Support for Kafka and MQTT as alternatives

## Service Dependencies

```
Gateway
├── Backend (required)
│   ├── Database (required)
│   └── Redis (optional)
└── AI/ML (optional for CRUD operations)

Backend
├── Database (required)
└── Redis (optional for messaging)

AI/ML
└── No external dependencies (self-contained)
```

## Communication Patterns

### Synchronous Communication
- Mobile App → Gateway → Backend/AI/ML (HTTP/REST)
- Gateway → Backend/AI/ML (HTTP proxy)
- Direct backend-to-AI/ML calls via BaseApiService

### Asynchronous Communication
- Redis pub/sub for event publishing
- Job queue for async AI/ML processing
- Event-driven architecture for supply chain events

## Deployment Architecture

### Docker Compose Deployment

**Services**:
- redis: Redis 7-alpine for messaging
- backend: Express backend with volume mounts
- ai-ml: Python FastAPI service
- gateway: API gateway
- prometheus: Metrics collection
- grafana: Metrics visualization
- elasticsearch: Log storage
- logstash: Log processing
- kibana: Log visualization

**Environment-Specific Configurations**:
- `docker-compose.dev.yml`: Development with hot reload
- `docker-compose.prod.yml`: Production with full observability
- `docker-compose.test.yml`: Lightweight testing configuration

### Kubernetes Deployment

**Components**:
- Deployments: backend, ai-ml, gateway, redis
- Services: LoadBalancer/ClusterIP for each component
- ConfigMap: Configuration management
- Secrets: Sensitive data storage
- HPA: Horizontal Pod Autoscaling (2-10 replicas)
- Ingress: External access configuration

**Auto-scaling Policies**:
- Backend: CPU 70%, Memory 80%, 2-10 replicas
- AI/ML: CPU 75%, Memory 85%, 2-5 replicas
- Gateway: CPU 60%, Memory 75%, 2-8 replicas

## Security Architecture

### Authentication
- JWT tokens for API authentication
- Token expiration: 24 hours (configurable)
- Role-based access control

### Security Headers
- Helmet middleware for security headers
- CORS configuration (currently wildcard, needs production hardening)
- Rate limiting to prevent abuse

### Vulnerability Management
- ESLint security plugin for code security
- npm audit for dependency vulnerabilities
- pip audit for Python dependencies

## Observability Architecture

### Logging
- Winston logger with JSON format
- File logging: error.log, combined.log
- Console logging in development
- Structured logging with context

### Metrics
- Prometheus client for metrics collection
- Custom metrics for business logic
- Circuit breaker state metrics
- Retry metrics
- Cache metrics (when implemented)

### Monitoring Stack
- Prometheus: Metrics collection and storage
- Grafana: Metrics visualization and dashboards
- ELK Stack: Log aggregation and analysis

## Resilience Architecture (NEW)

### Circuit Breaker Pattern
- **AI/ML Circuit Breaker**: Protects against Python service failures
- **Redis Circuit Breaker**: Protects against Redis connection failures
- **Database Circuit Breaker**: Protects against database failures
- **Configuration**: 3s timeout, 50% error threshold, 60s reset timeout
- **States**: Closed (normal), Open (failing fast), Half-open (testing recovery)

### Retry Pattern
- **Exponential Backoff**: With jitter to prevent thundering herd
- **Configurable Policies**: Default, network, database, AI/ML
- **Retryable Status Codes**: 408, 429, 500-504
- **Retryable Network Errors**: ECONNRESET, ECONNREFUSED, ETIMEDOUT, etc.

### Graceful Degradation
- **Degradation Levels**: Full, Partial, Minimal, Critical
- **Feature Flags**: Enable/disable features based on degradation level
- **Fallback Responses**: Cached or default responses when services unavailable
- **Auto-Recovery**: Periodic health checks and automatic service recovery

### Fallback Strategies
- **AI/ML Fallbacks**: Cached forecasts, simple reorder logic, distance-based routing
- **Database Fallbacks**: Empty results, cached data
- **Redis Fallbacks**: In-memory message logging

## Performance Architecture

### Current Performance Characteristics
- No caching layer (Redis available but not used for caching)
- Basic SQLite queries without optimization
- No API response compression
- Limited frontend asset optimization

### Performance Optimization Roadmap
- Implement Redis caching for frequently accessed data
- Add database indexes and query optimization
- Implement API response compression
- Optimize React Native bundle and assets
- Implement lazy loading where appropriate

## Scalability Architecture

### Current Scalability
- Horizontal Pod Autoscaling configured (2-10 replicas)
- Load balancing via Kubernetes services
- No database sharding strategy
- Monolithic tendencies in some components

### Scalability Enhancement Roadmap
- Add external load balancer configuration
- Implement custom metrics for auto-scaling
- Design database sharding strategy
- Evaluate microservices architecture opportunities

## Development Workflow

### Local Development
- Docker Compose for multi-service orchestration
- Hot reload for backend and AI/ML services
- Volume mounts for live code editing
- Local SQLite database

### Code Quality
- ESLint with security and best practices plugins
- Prettier for code formatting
- Pre-commit hooks with lint-staged
- Comprehensive coding standards documented

### Testing
- Jest for unit testing
- Supertest for API testing
- Integration tests for service interactions
- Manual testing with demo scripts

## Technology Decisions

### Express.js for Backend
- **Rationale**: Mature ecosystem, extensive middleware, good performance
- **Trade-offs**: Less opinionated than newer frameworks, requires more setup

### SQLite for Database
- **Rationale**: Simple deployment, no external dependencies, good for development
- **Trade-offs**: Limited scalability, single-writer limitations
- **Future**: Consider PostgreSQL for production scaling

### FastAPI for AI/ML
- **Rationale**: Native async support, automatic OpenAPI, excellent Python ecosystem
- **Trade-offs**: Smaller ecosystem than Node.js, requires Python expertise

### Redis for Messaging
- **Rationale**: Fast in-memory operations, pub/sub support, mature technology
- **Trade-offs**: Memory intensive, persistence requires configuration

## Future Considerations

### Short-term (Next 3-6 months)
- Implement Redis caching layer
- Add database query optimization
- Implement API response compression
- Enhance error handling with custom error classes

### Medium-term (6-12 months)
- Migrate to PostgreSQL for production
- Implement database sharding
- Evaluate microservices architecture
- Add comprehensive monitoring and alerting

### Long-term (12+ months)
- TypeScript migration for backend
- GraphQL API layer
- Advanced ML model deployment
- Real-time analytics dashboard

## Architecture Evolution

### Phase 1 (Current): Monolithic with Services
- Single backend service with multiple controllers
- Separate AI/ML service
- API gateway for routing
- Basic resilience patterns

### Phase 2 (Planned): Enhanced Monolith
- Comprehensive caching layer
- Optimized database queries
- Advanced resilience patterns
- Enhanced monitoring

### Phase 3 (Future): Microservices (Evaluated)
- Service boundary analysis
- Independent service deployment
- Advanced service mesh
- Event-driven architecture

## References

- **API Documentation**: `docs/API_INTEGRATION_GUIDE.md`
- **Gateway Routing**: `docs/GATEWAY_ROUTING.md`
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`
- **Coding Standards**: `backend/src/docs/codingStandards.md`
- **TypeScript Migration**: `backend/TYPESCRIPT_MIGRATION_PLAN.md`

## Last Updated
2026-09-10 - Added resilience patterns, enhanced rate limiting, monitoring capabilities documentation