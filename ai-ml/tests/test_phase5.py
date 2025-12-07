import requests
import time
import json

# Test the health endpoint
print("Testing health endpoint...")
response = requests.get("http://127.0.0.1:8000/health")
print(f"Health status: {response.status_code}")
print(f"Response: {response.json()}")

# Test the metrics endpoint
print("\nTesting metrics endpoint...")
response = requests.get("http://127.0.0.1:8000/metrics")
print(f"Metrics status: {response.status_code}")
print(f"Response: {response.json()}")

# Test the batch forecast endpoint
print("\nTesting batch forecast endpoint...")
forecast_data = [
    {
        "sku_id": "SKU001",
        "store_id": "STORE001",
        "forecast_horizon": 7
    },
    {
        "sku_id": "SKU002",
        "store_id": "STORE001",
        "forecast_horizon": 7
    }
]

response = requests.post(
    "http://127.0.0.1:8000/api/v1/demand/batch-forecast",
    headers={"Content-Type": "application/json"},
    data=json.dumps(forecast_data)
)

print(f"Batch forecast status: {response.status_code}")
if response.status_code == 200:
    result = response.json()
    print(f"Response: {result}")
    
    # Extract job IDs
    job_ids = result.get("job_ids", [])
    
    # Test job status checking
    print("\nTesting job status checking...")
    for job_id in job_ids:
        print(f"Checking status for job {job_id}...")
        status_response = requests.get(f"http://127.0.0.1:8000/api/v1/demand/forecast-job/{job_id}")
        print(f"Job {job_id} status: {status_response.status_code}")
        if status_response.status_code == 200:
            print(f"Job {job_id} details: {status_response.json()}")
else:
    print(f"Error: {response.text}")

# Test all jobs status endpoint
print("\nTesting all jobs status endpoint...")
response = requests.get("http://127.0.0.1:8000/api/v1/demand/forecast-jobs")
print(f"All jobs status: {response.status_code}")
if response.status_code == 200:
    print(f"All jobs: {response.json()}")