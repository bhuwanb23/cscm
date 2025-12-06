const localStorage = require('../../storage/localStorage');

describe('Local Storage Tests', () => {
  const testFileName = 'test_data';
  const testData = { name: 'Test', value: 123 };

  beforeEach(() => {
    // Clean up any existing test data
    localStorage.delete(testFileName);
  });

  afterEach(() => {
    // Clean up test data after each test
    localStorage.delete(testFileName);
  });

  test('should save and load data correctly', () => {
    // Save data
    localStorage.save(testFileName, testData);
    
    // Load data
    const loadedData = localStorage.load(testFileName);
    
    expect(loadedData).toEqual(testData);
  });

  test('should return null for non-existent files', () => {
    const loadedData = localStorage.load('non_existent_file');
    expect(loadedData).toBeNull();
  });

  test('should correctly check file existence', () => {
    // File should not exist initially
    expect(localStorage.exists(testFileName)).toBe(false);
    
    // Save data
    localStorage.save(testFileName, testData);
    
    // File should now exist
    expect(localStorage.exists(testFileName)).toBe(true);
  });

  test('should list files correctly', () => {
    // Save some test data
    localStorage.save(testFileName, testData);
    
    // List files
    const files = localStorage.list();
    
    expect(files).toContain(testFileName);
  });

  test('should delete files correctly', () => {
    // Save data
    localStorage.save(testFileName, testData);
    
    // Verify file exists
    expect(localStorage.exists(testFileName)).toBe(true);
    
    // Delete file
    localStorage.delete(testFileName);
    
    // Verify file no longer exists
    expect(localStorage.exists(testFileName)).toBe(false);
  });
});