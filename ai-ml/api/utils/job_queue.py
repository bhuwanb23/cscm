"""
Job Queue System for Asynchronous Processing

This module implements a simple job queue system for handling long-running operations
and batch processing in the AI/ML API.
"""

import asyncio
import uuid
import time
import json
import logging
from typing import Dict, Any, Callable, Optional
from enum import Enum
from dataclasses import dataclass, asdict
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class JobStatus(Enum):
    """Enumeration of possible job statuses"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class Job:
    """Represents a job in the queue"""
    id: str
    name: str
    status: JobStatus
    func: Callable
    args: tuple
    kwargs: dict
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    progress: int = 0  # Percentage progress (0-100)

class JobQueue:
    """Simple job queue system for asynchronous processing"""
    
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
        self.jobs: Dict[str, Job] = {}
        self.queue = asyncio.Queue()
        self.workers = []
        self.running = False
        
    async def start(self):
        """Start the job queue workers"""
        if self.running:
            return
            
        self.running = True
        # Start worker tasks
        for i in range(self.max_workers):
            worker = asyncio.create_task(self._worker(f"worker-{i}"))
            self.workers.append(worker)
        logger.info(f"Job queue started with {self.max_workers} workers")
        
    async def stop(self):
        """Stop the job queue workers"""
        if not self.running:
            return
            
        self.running = False
        # Cancel all workers
        for worker in self.workers:
            worker.cancel()
        # Wait for all workers to finish
        await asyncio.gather(*self.workers, return_exceptions=True)
        self.workers.clear()
        logger.info("Job queue stopped")
        
    async def _worker(self, worker_id: str):
        """Worker function that processes jobs from the queue"""
        logger.info(f"Worker {worker_id} started")
        try:
            while self.running:
                try:
                    # Get job from queue (with timeout to allow checking self.running)
                    job = await asyncio.wait_for(self.queue.get(), timeout=1.0)
                    
                    # Process the job
                    await self._process_job(job)
                    
                    # Mark task as done
                    self.queue.task_done()
                except asyncio.TimeoutError:
                    # Continue loop to check if still running
                    continue
                except Exception as e:
                    logger.error(f"Worker {worker_id} encountered an error: {e}")
        except asyncio.CancelledError:
            logger.info(f"Worker {worker_id} cancelled")
        except Exception as e:
            logger.error(f"Worker {worker_id} failed: {e}")
        finally:
            logger.info(f"Worker {worker_id} stopped")
            
    async def _process_job(self, job: Job):
        """Process a single job"""
        try:
            # Update job status
            job.status = JobStatus.RUNNING
            job.started_at = datetime.utcnow().isoformat() + "Z"
            self.jobs[job.id] = job
            logger.info(f"Processing job {job.id}: {job.name}")
            
            # Execute the job function
            result = await job.func(*job.args, **job.kwargs)
            
            # Update job with result
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.utcnow().isoformat() + "Z"
            job.result = result
            job.progress = 100
            self.jobs[job.id] = job
            logger.info(f"Completed job {job.id}: {job.name}")
            
        except Exception as e:
            # Update job with error
            job.status = JobStatus.FAILED
            job.completed_at = datetime.utcnow().isoformat() + "Z"
            job.error = str(e)
            self.jobs[job.id] = job
            logger.error(f"Failed job {job.id}: {job.name}, error: {e}")
            
    async def submit_job(self, name: str, func: Callable, *args, **kwargs) -> str:
        """
        Submit a job to the queue
        
        Args:
            name: Name of the job
            func: Function to execute
            *args: Positional arguments for the function
            **kwargs: Keyword arguments for the function
            
        Returns:
            str: Job ID
        """
        # Create job
        job_id = str(uuid.uuid4())
        job = Job(
            id=job_id,
            name=name,
            status=JobStatus.PENDING,
            func=func,
            args=args,
            kwargs=kwargs,
            created_at=datetime.utcnow().isoformat() + "Z"
        )
        
        # Add to jobs dictionary and queue
        self.jobs[job_id] = job
        await self.queue.put(job)
        
        logger.info(f"Submitted job {job_id}: {name}")
        return job_id
        
    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get the status of a job
        
        Args:
            job_id: ID of the job
            
        Returns:
            Dictionary with job status information or None if job not found
        """
        job = self.jobs.get(job_id)
        if not job:
            return None
            
        # Convert to dictionary, handling non-serializable fields
        job_dict = asdict(job)
        # Remove func since it's not serializable
        job_dict.pop('func', None)
        return job_dict
        
    def get_all_jobs(self) -> Dict[str, Dict[str, Any]]:
        """
        Get status of all jobs
        
        Returns:
            Dictionary mapping job IDs to job status information
        """
        result = {}
        for job_id, job in self.jobs.items():
            # Convert to dictionary, handling non-serializable fields
            job_dict = asdict(job)
            # Remove func since it's not serializable
            job_dict.pop('func', None)
            result[job_id] = job_dict
        return result
        
    async def cancel_job(self, job_id: str) -> bool:
        """
        Cancel a job (if it's still pending)
        
        Args:
            job_id: ID of the job to cancel
            
        Returns:
            bool: True if job was cancelled, False otherwise
        """
        job = self.jobs.get(job_id)
        if not job:
            return False
            
        if job.status == JobStatus.PENDING:
            job.status = JobStatus.CANCELLED
            job.completed_at = datetime.utcnow().isoformat() + "Z"
            self.jobs[job_id] = job
            logger.info(f"Cancelled job {job_id}: {job.name}")
            return True
            
        logger.warning(f"Cannot cancel job {job_id}: {job.name} (status: {job.status.value})")
        return False

# Global job queue instance
job_queue = JobQueue()

# Example usage
if __name__ == "__main__":
    async def example_task(name: str, duration: int = 2):
        """Example task that simulates work"""
        print(f"Starting task {name}")
        await asyncio.sleep(duration)
        print(f"Completed task {name}")
        return f"Result from {name}"
        
    async def main():
        # Start the job queue
        await job_queue.start()
        
        # Submit some jobs
        job1_id = await job_queue.submit_job("Task 1", example_task, "Task 1", 3)
        job2_id = await job_queue.submit_job("Task 2", example_task, "Task 2", 2)
        job3_id = await job_queue.submit_job("Task 3", example_task, "Task 3", 1)
        
        # Check status
        print("Job statuses:")
        for job_id in [job1_id, job2_id, job3_id]:
            status = job_queue.get_job_status(job_id)
            print(f"  {job_id}: {status['status']}")
            
        # Wait for all jobs to complete
        await asyncio.sleep(5)
        
        # Check final statuses
        print("\nFinal job statuses:")
        for job_id in [job1_id, job2_id, job3_id]:
            status = job_queue.get_job_status(job_id)
            print(f"  {job_id}: {status['status']}")
            
        # Stop the job queue
        await job_queue.stop()
        
    # Run the example
    asyncio.run(main())