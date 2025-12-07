"""
Monitoring and Logging Utility for AI/ML API

This module provides utilities for request logging, performance metrics,
health checks, and error tracking.
"""

import time
import logging
import functools
from typing import Dict, Any, Callable
from datetime import datetime
import psutil
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class APIMonitor:
    """API monitoring and logging utility"""
    
    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.total_response_time = 0.0
        self.endpoint_stats: Dict[str, Dict[str, Any]] = {}
        
    def log_request(self, method: str, path: str, status_code: int, response_time: float):
        """
        Log an API request
        
        Args:
            method: HTTP method (GET, POST, etc.)
            path: Request path
            status_code: HTTP status code
            response_time: Response time in seconds
        """
        self.request_count += 1
        self.total_response_time += response_time
        
        # Update endpoint statistics
        endpoint_key = f"{method} {path}"
        if endpoint_key not in self.endpoint_stats:
            self.endpoint_stats[endpoint_key] = {
                'count': 0,
                'total_time': 0.0,
                'errors': 0,
                'status_codes': {}
            }
            
        stats = self.endpoint_stats[endpoint_key]
        stats['count'] += 1
        stats['total_time'] += response_time
        
        # Update status code count
        if status_code not in stats['status_codes']:
            stats['status_codes'][status_code] = 0
        stats['status_codes'][status_code] += 1
        
        # Update error count
        if status_code >= 400:
            self.error_count += 1
            stats['errors'] += 1
            
        # Log the request
        logger.info(f"{method} {path} - Status: {status_code}, Time: {response_time:.3f}s")
        
    def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get performance metrics
        
        Returns:
            Dictionary with performance metrics
        """
        metrics = {
            'request_count': self.request_count,
            'error_count': self.error_count,
            'average_response_time': (
                self.total_response_time / self.request_count 
                if self.request_count > 0 else 0
            ),
            'uptime': self._get_uptime(),
            'system_stats': self._get_system_stats(),
            'endpoint_stats': self.endpoint_stats
        }
        return metrics
        
    def _get_uptime(self) -> float:
        """
        Get application uptime in seconds
        
        Returns:
            Uptime in seconds
        """
        # This is a simplified version - in a real app, you'd track start time
        return time.time() - psutil.boot_time()
        
    def _get_system_stats(self) -> Dict[str, Any]:
        """
        Get system statistics
        
        Returns:
            Dictionary with system statistics
        """
        try:
            return {
                'cpu_percent': psutil.cpu_percent(interval=0.1),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_usage': psutil.disk_usage('/').percent,
                'process_count': len(psutil.pids())
            }
        except Exception as e:
            logger.error(f"Error getting system stats: {e}")
            return {}
            
    def log_error(self, error_type: str, message: str, traceback: str = ""):
        """
        Log an error
        
        Args:
            error_type: Type of error
            message: Error message
            traceback: Error traceback (optional)
        """
        self.error_count += 1
        logger.error(f"ERROR [{error_type}]: {message}")
        if traceback:
            logger.error(f"Traceback: {traceback}")

# Global monitoring instance
api_monitor = APIMonitor()

def monitor_endpoint(func: Callable) -> Callable:
    """
    Decorator to monitor API endpoints
    
    Args:
        func: Function to decorate
        
    Returns:
        Decorated function
    """
    @functools.wraps(func)
    async def wrapper(*args, **kwargs):
        # Extract request information (simplified)
        # In a real implementation, you'd get this from the FastAPI request object
        method = getattr(func, '_method', 'UNKNOWN')
        path = getattr(func, '_path', 'UNKNOWN')
        
        start_time = time.time()
        status_code = 200
        
        try:
            result = await func(*args, **kwargs)
            return result
        except Exception as e:
            status_code = 500
            api_monitor.log_error("API_ERROR", str(e))
            raise
        finally:
            response_time = time.time() - start_time
            api_monitor.log_request(method, path, status_code, response_time)
            
    return wrapper

def get_health_status() -> Dict[str, Any]:
    """
    Get health status of the application
    
    Returns:
        Dictionary with health status information
    """
    try:
        # Check if the application can access essential resources
        health_checks = {
            'database': _check_database(),
            'external_apis': _check_external_apis(),
            'disk_space': _check_disk_space(),
            'memory': _check_memory()
        }
        
        # Overall health status
        overall_status = 'healthy' if all(health_checks.values()) else 'unhealthy'
        
        return {
            'status': overall_status,
            'timestamp': datetime.utcnow().isoformat() + "Z",
            'checks': health_checks
        }
    except Exception as e:
        logger.error(f"Error checking health status: {e}")
        return {
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat() + "Z",
            'error': str(e)
        }

def _check_database() -> bool:
    """
    Check database connectivity
    
    Returns:
        True if database is accessible, False otherwise
    """
    # This is a placeholder - in a real implementation, you'd check actual database connectivity
    try:
        # Simulate database check
        return True
    except Exception:
        return False

def _check_external_apis() -> bool:
    """
    Check external API connectivity
    
    Returns:
        True if external APIs are accessible, False otherwise
    """
    # This is a placeholder - in a real implementation, you'd check actual external API connectivity
    try:
        # Simulate external API check
        return True
    except Exception:
        return False

def _check_disk_space(min_free_gb: float = 1.0) -> bool:
    """
    Check if there's enough disk space
    
    Args:
        min_free_gb: Minimum free space in GB
        
    Returns:
        True if there's enough disk space, False otherwise
    """
    try:
        disk_usage = psutil.disk_usage('/')
        free_gb = disk_usage.free / (1024**3)
        return free_gb >= min_free_gb
    except Exception as e:
        logger.error(f"Error checking disk space: {e}")
        return False

def _check_memory(min_free_percent: float = 10.0) -> bool:
    """
    Check if there's enough memory
    
    Args:
        min_free_percent: Minimum free memory percentage
        
    Returns:
        True if there's enough memory, False otherwise
    """
    try:
        memory = psutil.virtual_memory()
        return memory.percent <= (100 - min_free_percent)
    except Exception as e:
        logger.error(f"Error checking memory: {e}")
        return False

# Example usage
if __name__ == "__main__":
    # Log some requests
    api_monitor.log_request("GET", "/api/v1/health", 200, 0.01)
    api_monitor.log_request("POST", "/api/v1/demand/forecast", 200, 0.5)
    api_monitor.log_request("POST", "/api/v1/demand/forecast", 500, 0.1)
    
    # Get performance metrics
    metrics = api_monitor.get_performance_metrics()
    print("Performance Metrics:")
    print(f"  Requests: {metrics['request_count']}")
    print(f"  Errors: {metrics['error_count']}")
    print(f"  Avg Response Time: {metrics['average_response_time']:.3f}s")
    
    # Get health status
    health = get_health_status()
    print("\nHealth Status:")
    print(f"  Status: {health['status']}")
    print(f"  Checks: {health['checks']}")