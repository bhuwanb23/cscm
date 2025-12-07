"""
Test script for advanced features (async processing, monitoring, etc.)
"""

import requests
import json
import time
import asyncio

BASE_URL = "http://localhost:8000"

def test_health_endpoint():
    """Test the health check endpoint"""
    print("Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Health check response: {response.json()}")
    return response.status_code == 200

def test_metrics_endpoint():
    """Test the metrics endpoint"""
    print("\nTesting metrics endpoint...")
    response = requests.get(f"{BASE_URL}/metrics")
    print(f"Metrics response: {response.json()}")
    return response.status_code == 200

def test_batch_forecast():
    """Test the batch forecast endpoint"""
    print("\nTesting batch forecast endpoint...")
    
    # Prepare batch forecast requests
    batch_requests = [
        {
            "sku_id": "SKU001",
            "store_id": "STORE001",
            "forecast_horizon": 7
        },
        {
            "sku_id": "SKU002",
            "store_id": "STORE002",
            "forecast_horizon": 14
        }
    ]
    
    response = requests.post(
        f"{BASE_URL}/api/v1/demand/batch-forecast",
        headers={"Content-Type": "application/json"},
        data=json.dumps(batch_requests)
    )
    
    print(f"Batch forecast response: {response.json()}")
    
    if response.status_code == 200:
        result = response.json()
        job_ids = result.get("job_ids", [])
        print(f"Submitted job IDs: {job_ids}")
        return job_ids
    else:
        print(f"Error submitting batch forecast: {response.text}")
        return []

def test_job_status(job_ids):
    """Test the job status endpoint"""
    print("\nTesting job status endpoint...")
    
    for job_id in job_ids:
        response = requests.get(f"{BASE_URL}/api/v1/demand/forecast-job/{job_id}")
        print(f"Job {job_id} status: {response.json()}")

def test_all_jobs_status():
    """Test the all jobs status endpoint"""
    print("\nTesting all jobs status endpoint...")
    
    response = requests.get(f"{BASE_URL}/api/v1/demand/forecast-jobs")
    print(f"All jobs status: {response.json()}")

async def main():
    """Main test function"""
    print("Starting advanced features tests...\n")
    
    # Test health endpoint
    if not test_health_endpoint():
        print("Health endpoint test failed!")
        return
    
    # Test metrics endpoint
    if not test_metrics_endpoint():
        print("Metrics endpoint test failed!")
        return
    
    # Test batch forecast
    job_ids = test_batch_forecast()
    
    if job_ids:
        # Wait a bit for jobs to process
        print("\nWaiting for jobs to process...")
        await asyncio.sleep(3)
        
        # Test job status
        test_job_status(job_ids)
        
        # Test all jobs status
        test_all_jobs_status()
    
    print("\nAll tests completed!")

if __name__ == "__main__":
    asyncio.run(main())