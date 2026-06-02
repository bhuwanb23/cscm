"""Helper to start the FastAPI server with correct package context."""
import sys, os

# Add project root so 'api' is a package
api_parent = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, api_parent)
os.chdir(api_parent)

import uvicorn
from api.main import app

if __name__ == "__main__":
    host = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8000
    uvicorn.run(app, host=host, port=port, log_level="warning")
