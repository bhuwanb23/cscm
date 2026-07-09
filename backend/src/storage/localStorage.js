const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class LocalStorage {
  constructor() {
    this.dataDir = path.join(__dirname, '..', '..', 'data');
    this.ensureDataDirectory();
  }

  ensureDataDirectory() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
        logger.info('Local Storage: Created data directory');
      }
    } catch (error) {
      logger.error(`Local Storage: Failed to create data directory: ${error.message}`);
    }
  }

  save(fileName, data) {
    try {
      const filePath = path.join(this.dataDir, `${fileName}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      logger.info(`Local Storage: Saved data to ${fileName}`);
    } catch (error) {
      logger.error(`Local Storage: Failed to save ${fileName}: ${error.message}`);
    }
  }

  load(fileName) {
    try {
      const filePath = path.join(this.dataDir, `${fileName}.json`);
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      logger.error(`Local Storage: Failed to load ${fileName}: ${error.message}`);
      return null;
    }
  }

  exists(fileName) {
    try {
      const filePath = path.join(this.dataDir, `${fileName}.json`);
      return fs.existsSync(filePath);
    } catch (error) {
      logger.error(`Local Storage: Failed to check existence of ${fileName}: ${error.message}`);
      return false;
    }
  }

  delete(fileName) {
    try {
      const filePath = path.join(this.dataDir, `${fileName}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Local Storage: Deleted ${fileName}`);
      }
    } catch (error) {
      logger.error(`Local Storage: Failed to delete ${fileName}: ${error.message}`);
    }
  }

  list() {
    try {
      if (fs.existsSync(this.dataDir)) {
        return fs.readdirSync(this.dataDir)
          .filter(file => file.endsWith('.json'))
          .map(file => file.replace('.json', ''));
      }
      return [];
    } catch (error) {
      logger.error(`Local Storage: Failed to list files: ${error.message}`);
      return [];
    }
  }
}

module.exports = new LocalStorage();