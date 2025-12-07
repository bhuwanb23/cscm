#!/usr/bin/env python3
"""
Test runner script for the CSCM AI/ML API
"""
import subprocess
import sys
import os

def run_tests():
    """Run all tests for the API"""
    print("🧪 Running CSCM AI/ML API Tests")
    print("=" * 50)
    
    # Test files to run
    test_files = [
        "tests/test_data_validation.py",
        "tests/test_security_auth.py",
        "tests/test_model_versioning.py",
        "tests/test_batch_processing.py",
        "tests/test_advanced_features.py"
    ]
    
    results = []
    
    for test_file in test_files:
        print(f"\nRunning tests in {test_file}...")
        try:
            # Run the test file
            result = subprocess.run([
                sys.executable, "-m", "pytest", test_file, "-v"
            ], capture_output=True, text=True, cwd=os.path.dirname(__file__))
            
            if result.returncode == 0:
                print("✅ PASSED")
                results.append(True)
            else:
                print("❌ FAILED")
                print("STDOUT:", result.stdout)
                print("STDERR:", result.stderr)
                results.append(False)
        except Exception as e:
            print(f"❌ ERROR: {e}")
            results.append(False)
    
    # Summary
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(results)
    total = len(results)
    
    print(f"Passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed!")
        return True
    else:
        print("⚠️  Some tests failed!")
        return False

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)