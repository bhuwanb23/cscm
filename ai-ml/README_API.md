# AI/ML API for Cognitive Supply Chain Mesh

This API provides RESTful endpoints for accessing all AI/ML models in the CSCM project.

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

## API Documentation
Once the server is running, you can access:
- Interactive API documentation: `http://localhost:8000/docs`
- Alternative API documentation: `http://localhost:8000/redoc`

## Core Endpoints

### Demand Forecasting
- `POST /api/v1/demand/forecast` - Generate demand forecast
- `GET /api/v1/demand/metrics/{sku_id}/{store_id}` - Get forecasting metrics

### Inventory Optimization
- `POST /api/v1/inventory/optimize` - Optimize inventory parameters
- `GET /api/v1/inventory/recommendation/{sku_id}/{store_id}` - Get inventory recommendation

### Routing & Logistics
- `POST /api/v1/routing/optimize` - Optimize delivery route
- `GET /api/v1/routing/status/{route_id}` - Get route status

## Project Structure
```
ai-ml/
├── api/
│   ├── main.py              # FastAPI application entry point
│   ├── routers/             # API route handlers
│   ├── models/              # Pydantic models for request/response
│   ├── services/            # Business logic and model wrappers
│   └── utils/               # Utility functions
├── requirements_api.txt     # API-specific requirements
└── README_API.md           # This file
```

## Development

### Adding New Models
1. Create a new router in `api/routers/`
2. Define request/response models in `api/models/`
3. Implement service logic in `api/services/`
4. Register the router in `api/main.py`

### Testing
```bash
# Run tests (when implemented)
pytest tests/
```