"""
Verification script for advanced features implementation
"""

import sys
import os
import asyncio

# Add paths for imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'utils'))
sys.path.append(os.path.join(os.path.dirname(__file__), 'api', 'services'))

def test_job_queue():
    """Test the job queue implementation"""
    print("Testing job queue implementation...")
    
    try:
        # Import job queue
        from api.utils.job_queue import JobQueue, JobStatus
        
        # Create job queue
        job_queue = JobQueue(max_workers=2)
        
        # Test job submission
        async def sample_job(name: str, duration: float = 0.1):
            await asyncio.sleep(duration)
            return f"Result from {name}"
            
        async def test_async():
            # Start job queue
            await job_queue.start()
            
            # Submit jobs
            job1_id = await job_queue.submit_job("Test Job 1", sample_job, "Job 1", 0.1)
            job2_id = await job_queue.submit_job("Test Job 2", sample_job, "Job 2", 0.1)
            
            print(f"Submitted jobs: {job1_id}, {job2_id}")
            
            # Wait a bit for jobs to process
            await asyncio.sleep(0.5)
            
            # Check job statuses
            job1_status = job_queue.get_job_status(job1_id)
            job2_status = job_queue.get_job_status(job2_id)
            
            print(f"Job 1 status: {job1_status['status']}")
            print(f"Job 2 status: {job2_status['status']}")
            
            # Print the type of status for debugging
            print(f"Job 1 status type: {type(job1_status['status'])}")
            
            # Get all jobs
            all_jobs = job_queue.get_all_jobs()
            print(f"Total jobs: {len(all_jobs)}")
            
            # Stop job queue
            await job_queue.stop()
            
            # Check if status is completed (convert to string if needed)
            job1_completed = str(job1_status['status']) == "completed" or \
                             str(job1_status['status']) == "JobStatus.COMPLETED"
            job2_completed = str(job2_status['status']) == "completed" or \
                             str(job2_status['status']) == "JobStatus.COMPLETED"
            
            return job1_completed and job2_completed
        
        # Run async test
        result = asyncio.run(test_async())
        print(f"Job queue test: {'PASSED' if result else 'FAILED'}")
        return result
        
    except Exception as e:
        print(f"Job queue test failed with error: {e}")
        return False

def test_monitoring():
    """Test the monitoring implementation"""
    print("\nTesting monitoring implementation...")
    
    try:
        # Import monitoring
        from api.utils.monitoring import APIMonitor, get_health_status
        
        # Create monitor
        monitor = APIMonitor()
        
        # Log some requests
        monitor.log_request("GET", "/api/v1/health", 200, 0.01)
        monitor.log_request("POST", "/api/v1/demand/forecast", 200, 0.5)
        monitor.log_request("POST", "/api/v1/demand/forecast", 500, 0.1)
        
        # Get metrics
        metrics = monitor.get_performance_metrics()
        print(f"Request count: {metrics['request_count']}")
        print(f"Error count: {metrics['error_count']}")
        
        # Get health status
        health = get_health_status()
        print(f"Health status: {health['status']}")
        
        # Test passed if we can get metrics and health status
        result = metrics['request_count'] == 3 and 'status' in health
        print(f"Monitoring test: {'PASSED' if result else 'FAILED'}")
        return result
        
    except Exception as e:
        print(f"Monitoring test failed with error: {e}")
        return False

def main():
    """Main verification function"""
    print("Verifying advanced features implementation...\n")
    
    # Test job queue
    job_queue_result = test_job_queue()
    
    # Test monitoring
    monitoring_result = test_monitoring()
    
    # Summary
    print("\n" + "="*50)
    print("ADVANCED FEATURES VERIFICATION SUMMARY")
    print("="*50)
    print(f"Job Queue Implementation: {'PASSED' if job_queue_result else 'FAILED'}")
    print(f"Monitoring Implementation: {'PASSED' if monitoring_result else 'FAILED'}")
    print("="*50)
    
    if job_queue_result and monitoring_result:
        print("All advanced features implemented successfully!")
        return True
    else:
        print("Some advanced features need attention.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)