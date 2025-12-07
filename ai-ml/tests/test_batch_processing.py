"""
Test suite for batch processing capabilities
"""
import pytest
import requests
import json
import time

class TestBatchProcessing:
    """Test suite for batch processing capabilities"""
    
    BASE_URL = "http://localhost:8000"
    API_PREFIX = "/api/v1"
    
    def test_batch_forecast_submission(self):
        """Test submitting batch forecast jobs"""
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
            },
            {
                "sku_id": "SKU003",
                "store_id": "STORE003",
                "forecast_horizon": 21
            }
        ]
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/demand/batch-forecast",
            headers={"Content-Type": "application/json"},
            data=json.dumps(batch_requests)
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "message" in result
        assert "job_ids" in result
        job_ids = result["job_ids"]
        assert len(job_ids) == 3
        # Verify all job IDs are unique
        assert len(set(job_ids)) == 3
        return job_ids
    
    def test_individual_job_status(self, job_ids=None):
        """Test checking individual job status"""
        if job_ids is None:
            job_ids = self.test_batch_forecast_submission()
        
        # Wait a bit for jobs to process
        time.sleep(2)
        
        for job_id in job_ids:
            response = requests.get(f"{self.BASE_URL}{self.API_PREFIX}/demand/forecast-job/{job_id}")
            assert response.status_code == 200
            data = response.json()
            assert "id" in data
            assert data["id"] == job_id
            assert "status" in data
            assert data["status"] in ["pending", "running", "completed"]
            assert "name" in data
            assert "args" in data
            assert "created_at" in data
    
    def test_all_jobs_status(self):
        """Test checking all jobs status"""
        response = requests.get(f"{self.BASE_URL}{self.API_PREFIX}/demand/forecast-jobs")
        assert response.status_code == 200
        data = response.json()
        # Should be a dictionary of jobs
        assert isinstance(data, dict)
        
        # Check structure of each job
        for job_id, job_data in data.items():
            assert "id" in job_data
            assert job_data["id"] == job_id
            assert "status" in job_data
            assert "name" in job_data
            assert "args" in job_data
            assert "created_at" in job_data
    
    def test_large_batch_submission(self):
        """Test submitting a large batch of jobs"""
        # Create a larger batch
        batch_requests = []
        for i in range(10):
            batch_requests.append({
                "sku_id": f"SKU{i:03d}",
                "store_id": f"STORE{i:03d}",
                "forecast_horizon": 7
            })
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/demand/batch-forecast",
            headers={"Content-Type": "application/json"},
            data=json.dumps(batch_requests)
        )
        
        assert response.status_code == 200
        result = response.json()
        assert "message" in result
        assert "job_ids" in result
        job_ids = result["job_ids"]
        assert len(job_ids) == 10
        # Verify all job IDs are unique
        assert len(set(job_ids)) == 10
    
    def test_batch_with_invalid_data(self):
        """Test batch submission with some invalid data"""
        # Mix of valid and invalid requests
        batch_requests = [
            {
                "sku_id": "SKU001",
                "store_id": "STORE001",
                "forecast_horizon": 7
            },
            {
                "sku_id": "SKU002"  # Missing required fields
                # Missing store_id and forecast_horizon
            }
        ]
        
        response = requests.post(
            f"{self.BASE_URL}{self.API_PREFIX}/demand/batch-forecast",
            headers={"Content-Type": "application/json"},
            data=json.dumps(batch_requests)
        )
        
        # Should return a validation error (422)
        assert response.status_code == 422
        data = response.json()
        assert "detail" in data

if __name__ == "__main__":
    pytest.main([__file__])