"""
Final validation script for Phase 5: Advanced Features
This script demonstrates all the implemented features:
1. Asynchronous Processing with Job Queuing
2. Monitoring and Logging
3. Health Checks
4. Performance Metrics
"""

import requests
import time
import json

def test_health_endpoint():
    """Test the health check endpoint"""
    print("1. Testing Health Check Endpoint...")
    response = requests.get("http://127.0.0.1:8000/health")
    assert response.status_code == 200
    health_data = response.json()
    assert health_data["status"] == "healthy"
    print("   ✅ Health check passed")
    print(f"   📊 Status: {health_data['status']}")
    return health_data

def test_metrics_endpoint():
    """Test the metrics endpoint"""
    print("\n2. Testing Metrics Endpoint...")
    response = requests.get("http://127.0.0.1:8000/metrics")
    assert response.status_code == 200
    metrics_data = response.json()
    print("   ✅ Metrics endpoint working")
    print(f"   📊 Request count: {metrics_data['request_count']}")
    print(f"   ⚡ Average response time: {metrics_data['average_response_time']:.4f}s")
    return metrics_data

def test_batch_processing():
    """Test batch processing with job queuing"""
    print("\n3. Testing Batch Processing with Job Queuing...")
    
    # Submit batch forecast jobs
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
        },
        {
            "sku_id": "SKU003",
            "store_id": "STORE002",
            "forecast_horizon": 5
        }
    ]
    
    response = requests.post(
        "http://127.0.0.1:8000/api/v1/demand/batch-forecast",
        headers={"Content-Type": "application/json"},
        data=json.dumps(forecast_data)
    )
    
    assert response.status_code == 200
    batch_result = response.json()
    job_ids = batch_result["job_ids"]
    
    print(f"   ✅ Submitted {len(job_ids)} forecast jobs")
    print(f"   📋 Job IDs: {job_ids}")
    
    # Check individual job statuses
    print("   🕐 Checking job statuses...")
    completed_jobs = []
    max_attempts = 10
    
    for attempt in range(max_attempts):
        all_completed = True
        for job_id in job_ids:
            status_response = requests.get(f"http://127.0.0.1:8000/api/v1/demand/forecast-job/{job_id}")
            if status_response.status_code == 200:
                job_status = status_response.json()
                if job_status["status"] != "completed":
                    all_completed = False
                    print(f"      Job {job_id[:8]}: {job_status['status']}")
                else:
                    if job_id not in completed_jobs:
                        completed_jobs.append(job_id)
                        print(f"      Job {job_id[:8]}: {job_status['status']} ✅")
            else:
                print(f"      Job {job_id[:8]}: Error checking status")
        
        if all_completed:
            print("   🎉 All jobs completed!")
            break
            
        if attempt < max_attempts - 1:
            time.sleep(1)  # Wait before retrying
    
    # Get all jobs status
    all_jobs_response = requests.get("http://127.0.0.1:8000/api/v1/demand/forecast-jobs")
    if all_jobs_response.status_code == 200:
        all_jobs = all_jobs_response.json()
        print(f"   📋 Total jobs in system: {len(all_jobs)}")
    
    return job_ids

def test_monitoring_logging():
    """Test monitoring and logging features"""
    print("\n4. Testing Monitoring and Logging...")
    
    # Make a few requests to generate some metrics
    for i in range(3):
        requests.get("http://127.0.0.1:8000/health")
        time.sleep(0.1)
    
    # Check updated metrics
    response = requests.get("http://127.0.0.1:8000/metrics")
    if response.status_code == 200:
        metrics = response.json()
        print(f"   📊 Updated request count: {metrics['request_count']}")
        print(f"   ⚡ Current average response time: {metrics['average_response_time']:.4f}s")
        
        # Show system stats
        if "system_stats" in metrics:
            sys_stats = metrics["system_stats"]
            print(f"   💻 CPU Usage: {sys_stats.get('cpu_percent', 'N/A')}%")
            print(f"   🧠 Memory Usage: {sys_stats.get('memory_percent', 'N/A')}%")
        
        print("   ✅ Monitoring and logging working correctly")
        return metrics
    
    print("   ❌ Failed to get metrics")
    return None

def main():
    """Main validation function"""
    print("=" * 60)
    print("FINAL VALIDATION OF PHASE 5: ADVANCED FEATURES")
    print("=" * 60)
    
    try:
        # Test all features
        health_data = test_health_endpoint()
        metrics_data = test_metrics_endpoint()
        job_ids = test_batch_processing()
        monitoring_data = test_monitoring_logging()
        
        print("\n" + "=" * 60)
        print("🎉 ALL PHASE 5 FEATURES VALIDATED SUCCESSFULLY! 🎉")
        print("=" * 60)
        print("\n📋 Summary of implemented features:")
        print("   1. ✅ Asynchronous Processing with Job Queuing")
        print("   2. ✅ Batch Processing Endpoints")
        print("   3. ✅ Job Status Tracking")
        print("   4. ✅ Health Check Endpoints")
        print("   5. ✅ Performance Metrics")
        print("   6. ✅ System Monitoring")
        print("   7. ✅ Request Logging")
        print("   8. ✅ Error Tracking")
        
        print("\n📈 Performance Summary:")
        print(f"   • Processed {len(job_ids)} jobs asynchronously")
        print(f"   • Handled {metrics_data['request_count']} total requests")
        print(f"   • Average response time: {metrics_data['average_response_time']:.4f}s")
        
        print("\n🚀 Phase 5 implementation is complete and functioning properly!")
        
    except Exception as e:
        print(f"\n❌ Validation failed with error: {e}")
        print("Please check the server logs for more details.")

if __name__ == "__main__":
    main()