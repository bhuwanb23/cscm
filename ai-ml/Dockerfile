# Multi-stage build for AI/ML service
FROM python:3.11-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements files
COPY requirements.txt requirements-extras.txt requirements-dev.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Production stage
FROM python:3.11-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy Python dependencies from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application code
COPY api/ ./api/
COPY legacy_models/ ./legacy_models/
COPY models/ ./models/
COPY config/ ./config/
COPY utils/ ./utils/
COPY scripts/ ./scripts/
COPY conftest.py pytest.ini ./

# Install requests for downloading models
RUN pip install --no-cache-dir requests

# Create non-root user
RUN useradd -m -u 1000 cscmuser && chown -R cscmuser:cscmuser /app
USER cscmuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Make startup script executable
RUN chmod +x scripts/startup.sh

# Run the application via startup script
CMD ["scripts/startup.sh"]