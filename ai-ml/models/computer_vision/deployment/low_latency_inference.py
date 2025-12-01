"""
Low-Latency Inference System for Warehouse Computer Vision

This module provides batching, streaming, and caching mechanisms to minimize
inference latency for real-time warehouse operations.
"""

import torch
import numpy as np
from collections import deque
from typing import List, Dict, Any, Optional, Union, Callable
import threading
import time
import logging
from concurrent.futures import ThreadPoolExecutor
import queue

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BatchProcessor:
    """
    Batch processor for grouping inference requests to improve throughput.
    
    Collects individual requests and processes them in batches to maximize
    hardware utilization.
    """
    
    def __init__(self, max_batch_size: int = 8, 
                 batch_timeout_ms: float = 10.0,
                 max_queue_size: int = 100):
        """
        Initialize batch processor.
        
        Args:
            max_batch_size: Maximum number of samples per batch
            batch_timeout_ms: Maximum time to wait for batch formation (milliseconds)
            max_queue_size: Maximum number of pending requests
        """
        self.max_batch_size = max_batch_size
        self.batch_timeout_ms = batch_timeout_ms / 1000.0  # Convert to seconds
        self.request_queue = queue.Queue(maxsize=max_queue_size)
        self.result_cache = {}  # Simple cache for results
        self.running = False
        self.worker_thread = None
        
        logger.info(f"BatchProcessor initialized with max_batch_size={max_batch_size}")
        
    def start(self):
        """Start the batch processing worker thread."""
        if not self.running:
            self.running = True
            self.worker_thread = threading.Thread(target=self._worker_loop)
            self.worker_thread.start()
            logger.info("BatchProcessor started")
    
    def stop(self):
        """Stop the batch processing worker thread."""
        if self.running:
            self.running = False
            if self.worker_thread:
                self.worker_thread.join()
            logger.info("BatchProcessor stopped")
    
    def submit_request(self, request_id: str, input_data: Any) -> None:
        """
        Submit a request for batched processing.
        
        Args:
            request_id: Unique identifier for the request
            input_data: Input data for inference
        """
        request = {
            'id': request_id,
            'data': input_data,
            'submit_time': time.time()
        }
        
        try:
            self.request_queue.put(request, timeout=1.0)
        except queue.Full:
            logger.warning(f"Request queue full, dropping request {request_id}")
    
    def get_result(self, request_id: str, timeout: float = 5.0) -> Optional[Any]:
        """
        Get result for a submitted request.
        
        Args:
            request_id: Request identifier
            timeout: Maximum time to wait for result (seconds)
            
        Returns:
            Result data or None if timeout
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            if request_id in self.result_cache:
                result = self.result_cache.pop(request_id)
                return result
            time.sleep(0.001)  # 1ms sleep
            
        logger.warning(f"Timeout waiting for result of request {request_id}")
        return None
    
    def _worker_loop(self):
        """Main worker loop for processing batches."""
        batch = []
        last_batch_time = time.time()
        
        while self.running:
            # Try to collect a batch
            try:
                # Wait for at least one request
                if not batch:
                    request = self.request_queue.get(timeout=0.01)
                    batch.append(request)
                    last_batch_time = time.time()
                else:
                    # Collect more requests for the batch
                    while len(batch) < self.max_batch_size:
                        try:
                            request = self.request_queue.get_nowait()
                            batch.append(request)
                        except queue.Empty:
                            break
                
                # Check if batch is ready
                current_time = time.time()
                if (len(batch) >= self.max_batch_size or 
                    current_time - last_batch_time >= self.batch_timeout_ms):
                    # Process batch
                    self._process_batch(batch)
                    batch.clear()
                    last_batch_time = current_time
                    
            except queue.Empty:
                # Check if we should process an incomplete batch due to timeout
                if batch and time.time() - last_batch_time >= self.batch_timeout_ms:
                    self._process_batch(batch)
                    batch.clear()
                    last_batch_time = time.time()
            
            # Small sleep to prevent busy waiting
            time.sleep(0.001)
    
    def _process_batch(self, batch: List[Dict[str, Any]]) -> None:
        """
        Process a batch of requests.
        
        Args:
            batch: List of requests to process
        """
        # In a real implementation, this would call the actual model
        # For now, we'll simulate processing
        batch_ids = [req['id'] for req in batch]
        batch_data = [req['data'] for req in batch]
        
        logger.info(f"Processing batch of {len(batch)} requests: {batch_ids}")
        
        # Simulate processing delay
        time.sleep(0.005 * len(batch))  # 5ms per item
        
        # Store results in cache
        for req in batch:
            # Simulate result
            result = {
                'request_id': req['id'],
                'processed_data': req['data'],  # Echo back the data
                'processing_time': time.time() - req['submit_time']
            }
            self.result_cache[req['id']] = result
            
        logger.info(f"Completed processing batch of {len(batch)} requests")


class StreamingInferenceEngine:
    """
    Streaming inference engine for continuous video processing.
    
    Processes video streams with pipelined inference to minimize latency.
    """
    
    def __init__(self, model_inference_fn: Callable,
                 pipeline_depth: int = 3,
                 buffer_size: int = 10):
        """
        Initialize streaming inference engine.
        
        Args:
            model_inference_fn: Function to perform model inference
            pipeline_depth: Number of parallel processing stages
            buffer_size: Size of frame buffer
        """
        self.model_inference_fn = model_inference_fn
        self.pipeline_depth = pipeline_depth
        self.frame_buffer = deque(maxlen=buffer_size)
        self.result_buffer = deque(maxlen=buffer_size)
        self.processing_stages = [None] * pipeline_depth
        self.running = False
        
        # Thread pool for parallel processing
        self.executor = ThreadPoolExecutor(max_workers=pipeline_depth)
        
        logger.info(f"StreamingInferenceEngine initialized with pipeline_depth={pipeline_depth}")
        
    def start(self):
        """Start the streaming inference engine."""
        self.running = True
        logger.info("StreamingInferenceEngine started")
        
    def stop(self):
        """Stop the streaming inference engine."""
        self.running = False
        self.executor.shutdown(wait=True)
        logger.info("StreamingInferenceEngine stopped")
        
    def add_frame(self, frame_id: str, frame_data: Any) -> None:
        """
        Add a frame to the processing pipeline.
        
        Args:
            frame_id: Unique identifier for the frame
            frame_data: Frame data to process
        """
        frame_entry = {
            'id': frame_id,
            'data': frame_data,
            'timestamp': time.time()
        }
        self.frame_buffer.append(frame_entry)
        
    def get_latest_result(self) -> Optional[Dict[str, Any]]:
        """
        Get the latest processed result.
        
        Returns:
            Latest result or None if no results available
        """
        if self.result_buffer:
            return self.result_buffer[-1]
        return None
    
    def process_frames(self) -> None:
        """Process frames in the pipeline."""
        if not self.running:
            return
            
        # Fill empty pipeline stages with new frames
        for i in range(self.pipeline_depth):
            if self.processing_stages[i] is None and self.frame_buffer:
                frame_entry = self.frame_buffer.popleft()
                # Submit for processing
                future = self.executor.submit(
                    self._process_frame, 
                    frame_entry
                )
                self.processing_stages[i] = {
                    'future': future,
                    'frame_entry': frame_entry
                }
        
        # Check for completed stages
        for i in range(self.pipeline_depth):
            stage = self.processing_stages[i]
            if stage is not None:
                future = stage['future']
                if future.done():
                    try:
                        result = future.result()
                        self.result_buffer.append(result)
                    except Exception as e:
                        logger.error(f"Error processing frame: {e}")
                    finally:
                        self.processing_stages[i] = None
    
    def _process_frame(self, frame_entry: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a single frame.
        
        Args:
            frame_entry: Frame entry to process
            
        Returns:
            Processing result
        """
        # Perform model inference
        inference_result = self.model_inference_fn(frame_entry['data'])
        
        return {
            'frame_id': frame_entry['id'],
            'result': inference_result,
            'processing_time': time.time() - frame_entry['timestamp']
        }


class InferenceCache:
    """
    Cache for inference results to avoid redundant computations.
    
    Stores recent results and serves them for identical inputs.
    """
    
    def __init__(self, max_cache_size: int = 1000, 
                 ttl_seconds: float = 60.0):
        """
        Initialize inference cache.
        
        Args:
            max_cache_size: Maximum number of entries in cache
            ttl_seconds: Time-to-live for cached entries (seconds)
        """
        self.max_cache_size = max_cache_size
        self.ttl_seconds = ttl_seconds
        self.cache = {}  # key -> (result, timestamp)
        self.key_order = deque()  # For LRU eviction
        
        logger.info(f"InferenceCache initialized with max_size={max_cache_size}")
        
    def get(self, key: str) -> Optional[Any]:
        """
        Get cached result for key.
        
        Args:
            key: Cache key
            
        Returns:
            Cached result or None if not found/expired
        """
        if key in self.cache:
            result, timestamp = self.cache[key]
            # Check if expired
            if time.time() - timestamp < self.ttl_seconds:
                return result
            else:
                # Remove expired entry
                del self.cache[key]
                if key in self.key_order:
                    self.key_order.remove(key)
                    
        return None
    
    def put(self, key: str, result: Any) -> None:
        """
        Put result in cache.
        
        Args:
            key: Cache key
            result: Result to cache
        """
        current_time = time.time()
        
        # Remove oldest entries if cache is full
        while len(self.cache) >= self.max_cache_size and self.key_order:
            oldest_key = self.key_order.popleft()
            if oldest_key in self.cache:
                del self.cache[oldest_key]
                
        # Add new entry
        self.cache[key] = (result, current_time)
        self.key_order.append(key)
        
        # Remove duplicates from key_order
        seen = set()
        new_order = deque()
        for k in self.key_order:
            if k not in seen:
                seen.add(k)
                new_order.append(k)
        self.key_order = new_order
    
    def invalidate(self, key: str) -> None:
        """
        Invalidate cache entry.
        
        Args:
            key: Cache key to invalidate
        """
        if key in self.cache:
            del self.cache[key]
        if key in self.key_order:
            self.key_order.remove(key)
    
    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()
        self.key_order.clear()


class PerformanceMonitor:
    """
    Monitor for tracking inference performance metrics.
    
    Tracks latency, throughput, and resource utilization.
    """
    
    def __init__(self):
        """Initialize performance monitor."""
        self.latency_history = deque(maxlen=1000)
        self.throughput_history = deque(maxlen=1000)
        self.resource_usage = {}
        self.start_time = time.time()
        
        logger.info("PerformanceMonitor initialized")
        
    def record_latency(self, latency_ms: float) -> None:
        """
        Record inference latency.
        
        Args:
            latency_ms: Latency in milliseconds
        """
        self.latency_history.append(latency_ms)
        
    def record_throughput(self, items_per_second: float) -> None:
        """
        Record inference throughput.
        
        Args:
            items_per_second: Throughput in items per second
        """
        self.throughput_history.append(items_per_second)
        
    def update_resource_usage(self, cpu_percent: float, 
                            memory_mb: float,
                            gpu_util: Optional[float] = None) -> None:
        """
        Update resource usage metrics.
        
        Args:
            cpu_percent: CPU usage percentage
            memory_mb: Memory usage in MB
            gpu_util: GPU utilization percentage (optional)
        """
        self.resource_usage = {
            'cpu_percent': cpu_percent,
            'memory_mb': memory_mb,
            'gpu_util': gpu_util,
            'timestamp': time.time()
        }
        
    def get_metrics(self) -> Dict[str, Any]:
        """
        Get current performance metrics.
        
        Returns:
            Performance metrics
        """
        if self.latency_history:
            avg_latency = sum(self.latency_history) / len(self.latency_history)
            min_latency = min(self.latency_history)
            max_latency = max(self.latency_history)
        else:
            avg_latency = min_latency = max_latency = 0.0
            
        if self.throughput_history:
            avg_throughput = sum(self.throughput_history) / len(self.throughput_history)
            current_throughput = self.throughput_history[-1] if self.throughput_history else 0.0
        else:
            avg_throughput = current_throughput = 0.0
            
        uptime = time.time() - self.start_time
        
        return {
            'latency': {
                'average_ms': avg_latency,
                'min_ms': min_latency,
                'max_ms': max_latency,
                'samples': len(self.latency_history)
            },
            'throughput': {
                'average_fps': avg_throughput,
                'current_fps': current_throughput,
                'samples': len(self.throughput_history)
            },
            'resources': self.resource_usage,
            'uptime_seconds': uptime
        }


# Example usage
if __name__ == "__main__":
    # Example model inference function
    def example_inference_fn(data):
        # Simulate inference delay
        time.sleep(0.01)  # 10ms
        return {"objects": [], "confidence": 0.95}
    
    # Test batch processor
    batch_processor = BatchProcessor(max_batch_size=4, batch_timeout_ms=20.0)
    batch_processor.start()
    
    # Submit some requests
    for i in range(10):
        batch_processor.submit_request(f"req_{i}", f"data_{i}")
        time.sleep(0.005)  # 5ms between requests
    
    # Get results
    time.sleep(0.1)  # Wait for processing
    for i in range(10):
        result = batch_processor.get_result(f"req_{i}")
        if result:
            print(f"Result for req_{i}: {result}")
    
    batch_processor.stop()
    
    # Test streaming engine
    streaming_engine = StreamingInferenceEngine(example_inference_fn)
    streaming_engine.start()
    
    # Add some frames
    for i in range(5):
        streaming_engine.add_frame(f"frame_{i}", f"frame_data_{i}")
        streaming_engine.process_frames()
        time.sleep(0.01)
    
    # Get results
    result = streaming_engine.get_latest_result()
    if result:
        print(f"Latest streaming result: {result}")
        
    streaming_engine.stop()
    
    # Test cache
    cache = InferenceCache(max_cache_size=100)
    cache.put("key1", {"result": "value1"})
    cached_value = cache.get("key1")
    print(f"Cached value: {cached_value}")
    
    print("Low-latency inference components initialized successfully")