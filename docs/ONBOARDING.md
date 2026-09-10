# CSCM Developer Onboarding Guide

## Welcome to the CSCM Team

This guide will help you get started with the Cognitive Supply Chain Mesh (CSCM) project. CSCM is a multi-tier supply chain intelligence platform with a React Native mobile app, Node.js backend, and Python AI/ML service.

## Prerequisites

### Required Software
- **Node.js**: v18+ (LTS recommended)
- **Python**: 3.11+ (use the venv in ai-ml directory)
- **Docker**: 20.10+ (for containerized development)
- **Docker Compose**: v2.0+
- **Git**: Latest version
- **PowerShell** (Windows) or Bash (Linux/Mac)

### IDE Recommendations
- **VS Code**: Recommended with extensions:
  - ESLint
  - Prettier
  - Python
  - Docker
  - GitLens

### Optional Tools
- **Postman**: For API testing
- **Redis Desktop Manager**: For Redis management
- **DB Browser for SQLite**: For database management

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd cscm
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev  # Start backend in development mode
```

### 3. AI/ML Service Setup
```bash
cd ai-ml
# Activate Python virtual environment
ai-ml\venv\Scripts\Activate.ps1  # Windows PowerShell
# or
source venv/bin/activate  # Linux/Mac

pip install -r requirements.txt
uvicorn api.main:app --reload  # Start AI/ML service
```

### 4. Mobile App Setup
```bash
cd App
npm install
npx expo start  # Start Expo development server
```

### 5. Docker Compose Setup (Optional)
```bash
# Development environment
docker-compose -f docker-compose.dev.yml up

# Production environment
docker-compose -f docker-compose.prod.yml up
```

## Project Structure

```
cscm/
├── App/                      # React Native mobile app
│   ├── login/               # Role selection screen
│   ├── users/               # Role-specific screens
│   │   ├── shopkeepers/     # Shopkeeper features
│   │   ├── transporters/    # Transporter features
│   │   ├── wholesalers/    # Wholesaler features
│   │   └── mesh/           # Mesh console features
│   └── src/                 # Shared code
│       ├── api/             # API client
│       ├── hooks/           # Custom hooks
│       └── utils/           # Utility functions
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── api/             # API routes and controllers
│   │   │   ├── controllers/ # Request handlers
│   │   │   ├── middleware/  # Express middleware
│   │   │   └── routes/      # Route definitions
│   │   ├── config/          # Configuration
│   │   ├── gateway/         # API gateway
│   │   ├── messaging/       # Redis/Kafka/MQTT
│   │   ├── models/          # Data models
│   │   ├── services/        # Business logic
│   │   ├── storage/         # Database operations
│   │   ├── utils/           # Utility functions
│   │   ├── agents/          # Supply chain agents
│   │   ├── resilience/      # Circuit breakers, retry, degradation
│   │   └── docs/            # Documentation
│   ├── data/                # Database files
│   ├── logs/                # Log files
│   ├── package.json         # Dependencies
│   └── .eslintrc.js         # ESLint configuration
├── ai-ml/                   # Python AI/ML service
│   ├── api/                 # FastAPI application
│   │   ├── main.py          # Application entry point
│   │   ├── routers/         # API routers
│   │   ├── models/          # Pydantic models
│   │   └── utils/           # Utility functions
│   ├── legacy_models/       # Model implementations
│   ├── venv/                # Python virtual environment
│   └── requirements.txt     # Python dependencies
├── docs/                    # Documentation
├── k8s/                     # Kubernetes manifests
├── scripts/                 # Utility scripts
└── docker-compose.yml       # Docker Compose configuration
```

## Development Workflow

### Git Workflow

1. **Branch Naming Convention**
   - `feature/<feature-name>` for new features
   - `bugfix/<bug-description>` for bug fixes
   - `hotfix/<urgent-fix>` for urgent fixes
   - `docs/<documentation-update>` for documentation

2. **Commit Message Format**
   ```
   feat: add user authentication
   fix: resolve inventory calculation bug
   docs: update API documentation
   refactor: simplify error handling
   ```

3. **Pull Request Process**
   - Create feature branch from main
   - Make changes and commit
   - Create pull request
   - Request code review
   - Address review feedback
   - Merge after approval

### Code Review Checklist
- [ ] Code follows coding standards
- [ ] ESLint passes with no errors
- [ ] Prettier formatting applied
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No sensitive data committed
- [ ] No console.log statements in production code

### Testing

**Run Backend Tests**:
```bash
cd backend
npm test                    # Unit tests
npm run test:integration   # Integration tests
```

**Run AI/ML Tests**:
```bash
cd ai-ml
pytest tests/              # Run all tests
pytest tests/unit/         # Unit tests only
pytest tests/integration/  # Integration tests only
```

**Run Mobile App Tests**:
```bash
cd App
npm test                   # Jest tests
```

### Code Quality

**Lint Code**:
```bash
cd backend
npm run lint               # Check for linting errors
npm run lint:fix           # Auto-fix linting errors
npm run format             # Format code with Prettier
npm run format:check       # Check formatting
```

## Common Development Tasks

### Adding a New API Endpoint

1. **Create Controller Function** in `backend/src/api/controllers/`:
```javascript
async function myEndpoint(req, res) {
  try {
    const result = await myService.execute(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
```

2. **Create Route** in `backend/src/api/routes/`:
```javascript
const router = require('express').Router();
const { myEndpoint } = require('../controllers/myController');

router.post('/my-endpoint', myEndpoint);

module.exports = router;
```

3. **Register Route** in `backend/src/api/server.js`:
```javascript
const myRoutes = require('./routes/myRoutes');
app.use('/api/v1/my', myRoutes);
```

4. **Add Tests** in `backend/src/tests/`:
```javascript
describe('My Endpoint', () => {
  it('should return success', async () => {
    const response = await request(app)
      .post('/api/v1/my/my-endpoint')
      .send({ data: 'test' });
    expect(response.status).toBe(200);
  });
});
```

### Adding a New AI/ML Endpoint

1. **Create Pydantic Models** in `ai-ml/api/models/`:
```python
from pydantic import BaseModel

class MyRequest(BaseModel):
    data: str
    
class MyResponse(BaseModel):
    result: str
    confidence: float
```

2. **Create Router** in `ai-ml/api/routers/`:
```python
from fastapi import APIRouter
from ..models import MyRequest, MyResponse

router = APIRouter()

@router.post("/my-endpoint", response_model=MyResponse)
async def my_endpoint(request: MyRequest):
    result = my_ml_function(request.data)
    return MyResponse(result=result, confidence=0.95)
```

3. **Register Router** in `ai-ml/api/main.py`:
```python
from .routers import my_router
app.include_router(my_router.router, prefix="/api/v1/my", tags=["My Feature"])
```

### Adding a New Agent

1. **Create Agent File** in `backend/src/agents/`:
```javascript
class MyAgent {
  constructor(config) {
    this.config = config;
  }
  
  async execute() {
    // Agent logic here
  }
}

module.exports = MyAgent;
```

2. **Register Agent** in `backend/src/agents/startAgents.js`:
```javascript
const MyAgent = require('./MyAgent');
// Add to agent registry
```

### Debugging Locally

**Backend Debugging**:
```bash
cd backend
node --inspect src/api/server.js
# Then connect Chrome DevTools to localhost:9229
```

**AI/ML Debugging**:
```bash
cd ai-ml
python -m debugpy --listen 5678 api/main.py
# Then use VS Code Python debugger
```

**Mobile App Debugging**:
```bash
cd App
npx expo start
# Press 'd' to open DevTools
```

## Architecture Overview

### Service Communication Flow

```
Mobile App → Gateway (8080) → Backend (3000) or AI/ML (8000)
```

### Key Services

**Gateway** (`backend/src/gateway/gateway.js`):
- Routes requests to backend or AI/ML based on path
- Provides health checks
- Handles proxy errors

**Backend** (`backend/src/api/server.js`):
- REST API for CRUD operations
- Authentication (JWT)
- Database operations
- Business logic

**AI/ML** (`ai-ml/api/main.py`):
- AI/ML-powered endpoints
- Demand forecasting
- Inventory optimization
- Route optimization

### Data Flow

1. **Authentication Flow**:
   - Mobile app sends credentials to gateway
   - Gateway routes to backend `/api/v1/auth/login`
   - Backend validates credentials and returns JWT token
   - Mobile app stores token for subsequent requests

2. **Data Query Flow**:
   - Mobile app requests data with JWT token
   - Gateway routes to appropriate backend endpoint
   - Backend queries SQLite database
   - Backend returns data to mobile app

3. **AI/ML Request Flow**:
   - Mobile app requests AI/ML operation
   - Gateway routes to AI/ML service
   - AI/ML service processes request
   - AI/ML service returns results

## Best Practices

### Coding Standards

**JavaScript**:
- Use camelCase for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Use 2-space indentation
- Always use semicolons
- Use single quotes for strings

**Python**:
- Use snake_case for variables and functions
- Use PascalCase for classes
- Use UPPER_SNAKE_CASE for constants
- Use 4-space indentation
- Follow PEP 8 style guide

### Error Handling

**JavaScript**:
```javascript
try {
  const result = await someAsyncOperation();
  return successResponse(result);
} catch (error) {
  logger.error('Operation failed:', error);
  return errorResponse(error.message);
}
```

**Python**:
```python
try:
    result = await some_async_operation()
    return {"success": True, "data": result}
except Exception as e:
    logger.error(f"Operation failed: {e}")
    return {"success": False, "error": str(e)}
```

### Security Practices

1. **Never commit secrets**
   - Use environment variables
   - Use .env files (gitignored)
   - Use secrets management in production

2. **Validate all inputs**
   - Use validation utilities
   - Sanitize user input
   - Type-check all data

3. **Use HTTPS in production**
   - Configure SSL/TLS
   - Use secure cookies
   - Implement CSRF protection

### Testing Practices

1. **Write tests for new features**
   - Unit tests for individual functions
   - Integration tests for service interactions
   - E2E tests for critical workflows

2. **Mock external dependencies**
   - Mock database calls in unit tests
   - Mock external API calls
   - Use test fixtures for data

3. **Maintain test coverage**
   - Aim for >80% code coverage
   - Run tests before committing
   - Fix failing tests immediately

### Documentation Practices

1. **Document code changes**
   - Update README for new features
   - Update API documentation
   - Add JSDoc/Docstring comments

2. **Keep documentation current**
   - Review documentation regularly
   - Update when architecture changes
   - Document decisions and trade-offs

## Useful Commands

### Backend
```bash
npm start              # Start production server
npm run dev            # Start development server with hot reload
npm test               # Run tests
npm run lint           # Check code quality
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code
```

### AI/ML
```bash
uvicorn api.main:app --reload     # Start development server
uvicorn api.main:app               # Start production server
pytest                             # Run tests
pytest -v                          # Verbose test output
pytest --cov                       # Coverage report
```

### Mobile App
```bash
npx expo start                      # Start Expo server
npx expo start --tunnel            # Start with tunneling
npm test                            # Run tests
```

### Docker
```bash
docker-compose up                   # Start all services
docker-compose up -d               # Start in background
docker-compose down                 # Stop all services
docker-compose logs -f backend      # Follow backend logs
docker-compose ps                   # Check service status
```

## IDE Configuration

### VS Code Extensions
- ESLint
- Prettier
- Python
- Docker
- GitLens
- Material Icon Theme
- Auto Rename Tag

### VS Code Settings (`.vscode/settings.json`)
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "python.linting.enabled": true,
  "python.formatting.provider": "black"
}
```

## Getting Help

### Internal Resources
- Architecture documentation: `docs/ARCHITECTURE.md`
- Troubleshooting guide: `docs/TROUBLESHOOTING.md`
- API integration guide: `docs/API_INTEGRATION_GUIDE.md`
- Gateway routing: `docs/GATEWAY_ROUTING.md`
- Coding standards: `backend/src/docs/codingStandards.md`

### Common Issues
- **Port already in use**: Kill process using the port
- **Module not found**: Run `npm install` or `pip install`
- **Database locked**: Restart backend service
- **Redis connection failed**: Check Redis is running

### Contact Information
- Development team: [team-email]
- Project lead: [lead-email]
- Documentation: [docs-link]

## First Week Checklist

- [ ] Complete environment setup
- [ ] Run all services locally
- [ ] Run test suite
- [ ] Read architecture documentation
- [ ] Review coding standards
- [ ] Set up IDE with recommended extensions
- [ ] Make a small test change to understand workflow
- [ ] Attend team standup
- [ ] Set up development environment
- [ ] Review recent commits to understand project direction

## Next Steps

After completing this onboarding guide:
1. Explore the codebase
2. Review existing issues
3. Pick a small task to get started
4. Ask questions when unsure
5. Contribute to documentation

Welcome to the team! We're excited to have you working on CSCM.

## Last Updated
2026-09-10 - Initial onboarding guide creation