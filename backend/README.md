# CSCM Backend

Backend services for the Cognitive Supply Chain Mesh (CSCM) platform.

## Overview

This repository contains the backend services for the CSCM platform, including:

- REST API server
- Messaging system (Kafka/MQTT)
- Agent orchestration
- Model serving
- Data processing pipelines

## Prerequisites

- Node.js 16+
- Docker and Docker Compose
- MongoDB
- Kafka
- MQTT Broker

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
4. Start the services using Docker Compose:
   ```bash
   docker-compose up -d
   ```

## Project Structure

```
src/
├── api/          # REST API server and routes
├── config/       # Configuration files
├── gateway/      # API gateway configuration
├── messaging/    # Kafka and MQTT clients
├── agents/       # Agent orchestration
├── models/       # Model serving
├── services/     # Business logic services
├── utils/        # Utility functions
├── docs/         # Documentation
└── tests/        # Test files
```

## API Endpoints

- `GET /` - Health check
- `GET /health` - Detailed health status

## Development

To run the development server:

```bash
npm run dev
```

## Testing

To run tests:

```bash
npm test
```

## License

MIT