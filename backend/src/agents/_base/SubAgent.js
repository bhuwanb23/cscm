const fs = require('fs');
const path = require('path');

class SubAgent {
  constructor(name, parentId, apiService, options = {}) {
    this.name = name;
    this.parentId = parentId;
    this.apiService = apiService;
    this.state = {};
  }

  log(...args) {
    console.log(`[${this.parentId}:${this.name}]`, ...args);
  }

  error(...args) {
    console.error(`[${this.parentId}:${this.name}]`, ...args);
  }

  warn(...args) {
    console.warn(`[${this.parentId}:${this.name}]`, ...args);
  }

  loadState(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        this.state = JSON.parse(data);
        this.log('State loaded from', filePath);
        return true;
      }
    } catch (err) {
      this.error('Failed to load state:', err.message);
    }
    return false;
  }

  saveState(filePath) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, JSON.stringify(this.state, null, 2));
      this.log('State saved to', filePath);
      return true;
    } catch (err) {
      this.error('Failed to save state:', err.message);
      return false;
    }
  }
}

module.exports = SubAgent;
