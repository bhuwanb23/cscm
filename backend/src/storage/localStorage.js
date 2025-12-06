const fs = require('fs');
const path = require('path');

/**
 * Local Storage Utility
 * 
 * Provides simple local storage functionality using JSON files.
 * This is a lightweight alternative to a full database for local development.
 */

class LocalStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '..', '..', 'data');
    this.ensureDataDirectory();
  }

  /**
   * Ensure the data directory exists
   */
  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        console.log('Local Storage: Created data directory');
      }
    } catch (error) {
      console.error('Local Storage: Failed to create data directory:', error.message);
    }
  }

  /**
   * Save data to a JSON file
   * @param {string} fileName - Name of the file to save to
   * @param {Object} data - Data to save
   */
  save(fileName, data) {
    try {
      const filePath = path.join(this.dataDir, `${fileName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      console.log(`Local Storage: Saved data to ${fileName}`);
    } catch (error) {
      console.error(`Local Storage: Failed to save ${fileName}:`, error.message);
    }
  }

  /**
   * Load data from a JSON file
   * @param {string} fileName - Name of the file to load from
   * @returns {Object|null} - Loaded data or null if not found
   */
  load(fileName) {
    try {
      const filePath = path.join(this.dataDir, `${fileName}.json`);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error(`Local Storage: Failed to load ${fileName}:`, error.message);
      return null;
    }
  }

  /**
   * Check if a file exists
   * @param {string} fileName - Name of the file to check
   * @returns {boolean} - True if file exists, false otherwise
   */
  exists(fileName) {
    try {
      const filePath = path.join(this.dataDir, `${fileName}.json`);
      return fs.existsSync(filePath);
    } catch (error) {
      console.error(`Local Storage: Failed to check existence of ${fileName}:`, error.message);
      return false;
    }
  }

  /**
   * Delete a file
   * @param {string} fileName - Name of the file to delete
   */
  delete(fileName) {
    try {
      const filePath = path.join(this.dataDir, `${fileName}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Local Storage: Deleted ${fileName}`);
      }
    } catch (error) {
      console.error(`Local Storage: Failed to delete ${fileName}:`, error.message);
    }
  }

  /**
   * List all stored files
   * @returns {Array<string>} - Array of file names
   */
  list() {
    try {
      if (fs.existsSync(this.dataDir)) {
        return fs.readdirSync(this.dataDir)
          .filter(file => file.endsWith('.json'))
          .map(file => file.replace('.json', ''));
      }
      return [];
    } catch (error) {
      console.error('Local Storage: Failed to list files:', error.message);
      return [];
    }
  }
}

// Export singleton instance
module.exports = new LocalStorage();