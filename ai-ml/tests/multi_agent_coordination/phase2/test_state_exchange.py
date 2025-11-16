"""
Tests for Compressed State Exchange
"""

import pytest
import numpy as np
import sys
import os

# Add the models directory to the path
parent_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..')
sys.path.insert(0, parent_dir)

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

pytestmark = pytest.mark.skipif(not HAS_TORCH, reason="PyTorch not available")

from models.multi_agent_coordination.communication_protocols.state_exchange import CompressedStateExchange


class TestCompressedStateExchange:
    """Test cases for CompressedStateExchange."""
    
    def test_initialization(self):
        """Test exchange initialization."""
        exchange = CompressedStateExchange(
            state_dim=20,
            compressed_dim=8
        )
        
        assert exchange.state_dim == 20
        assert exchange.compressed_dim == 8
    
    def test_compress_decompress(self):
        """Test state compression and decompression."""
        exchange = CompressedStateExchange(
            state_dim=10,
            compressed_dim=4
        )
        
        state = np.random.randn(10)
        compressed = exchange.compress_state(state)
        
        assert compressed.shape == (4,)
        
        decompressed = exchange.decompress_state(compressed)
        
        assert decompressed.shape == (10,)
    
    def test_get_compression_ratio(self):
        """Test compression ratio calculation."""
        exchange = CompressedStateExchange(
            state_dim=20,
            compressed_dim=5
        )
        
        ratio = exchange.get_compression_ratio()
        
        assert ratio == 5 / 20


if __name__ == "__main__":
    pytest.main([__file__, "-v"])

