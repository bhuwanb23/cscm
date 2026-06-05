const fs = require('fs');
const path = require('path');
const os = require('os');
const SubAgent = require('../../agents/_base/SubAgent');

describe('SubAgent base class', () => {
  let apiService;
  let agent;

  beforeEach(() => {
    apiService = { call: jest.fn() };
    agent = new SubAgent('TestAgent', 'Parent-001', apiService);
  });

  describe('constructor', () => {
    it('should set name, parentId, and apiService', () => {
      expect(agent.name).toBe('TestAgent');
      expect(agent.parentId).toBe('Parent-001');
      expect(agent.apiService).toBe(apiService);
    });

    it('should initialize state as empty object', () => {
      expect(agent.state).toEqual({});
    });

    it('should accept an empty options object', () => {
      const a = new SubAgent('X', 'Y', apiService, {});
      expect(a.state).toEqual({});
    });
  });

  describe('log', () => {
    it('should log with parent:name prefix', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      agent.log('hello', 'world');
      expect(spy).toHaveBeenCalledWith('[Parent-001:TestAgent]', 'hello', 'world');
      spy.mockRestore();
    });
  });

  describe('error', () => {
    it('should error-log with parent:name prefix', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      agent.error('something failed');
      expect(spy).toHaveBeenCalledWith('[Parent-001:TestAgent]', 'something failed');
      spy.mockRestore();
    });
  });

  describe('warn', () => {
    it('should warn-log with parent:name prefix', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      agent.warn('watch out');
      expect(spy).toHaveBeenCalledWith('[Parent-001:TestAgent]', 'watch out');
      spy.mockRestore();
    });
  });

  describe('loadState', () => {
    let tmpDir;
    let filePath;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'subagent-test-'));
      filePath = path.join(tmpDir, 'state.json');
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should return false if file does not exist', () => {
      const result = agent.loadState(filePath);
      expect(result).toBe(false);
    });

    it('should load state from existing file', () => {
      const data = { counter: 5, last: 'x' };
      fs.writeFileSync(filePath, JSON.stringify(data));
      const result = agent.loadState(filePath);
      expect(result).toBe(true);
      expect(agent.state).toEqual(data);
    });

    it('should handle corrupted JSON gracefully', () => {
      fs.writeFileSync(filePath, 'not valid json {');
      const result = agent.loadState(filePath);
      expect(result).toBe(false);
      expect(agent.state).toEqual({});
    });

    it('should return false and not crash on permission errors', () => {
      const badPath = path.join(tmpDir, 'nonexistent', 'state.json');
      const result = agent.loadState(badPath);
      expect(result).toBe(false);
    });
  });

  describe('saveState', () => {
    let tmpDir;
    let filePath;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'subagent-test-'));
      filePath = path.join(tmpDir, 'state.json');
    });

    afterEach(() => {
      if (fs.existsSync(tmpDir)) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should save state to file', () => {
      agent.state = { foo: 'bar', n: 42 };
      const result = agent.saveState(filePath);
      expect(result).toBe(true);
      const written = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(written).toEqual({ foo: 'bar', n: 42 });
    });

    it('should create parent directories if they do not exist', () => {
      const nestedPath = path.join(tmpDir, 'a', 'b', 'c', 'state.json');
      agent.state = { x: 1 };
      const result = agent.saveState(nestedPath);
      expect(result).toBe(true);
      expect(fs.existsSync(nestedPath)).toBe(true);
    });

    it('should overwrite existing state file', () => {
      fs.writeFileSync(filePath, JSON.stringify({ old: true }));
      agent.state = { new: true };
      agent.saveState(filePath);
      const written = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      expect(written).toEqual({ new: true });
    });

    it('should round-trip state', () => {
      agent.state = { items: [1, 2, 3], meta: { ok: true } };
      agent.saveState(filePath);
      const fresh = new SubAgent('X', 'Y', apiService);
      fresh.loadState(filePath);
      expect(fresh.state).toEqual(agent.state);
    });
  });

  describe('extensibility', () => {
    it('should support subclassing', () => {
      class ChildAgent extends SubAgent {
        constructor(id, api) {
          super('Child', 'Parent-X', api);
          this.id = id;
        }
        greet() { return `hello ${this.id}`; }
      }
      const c = new ChildAgent('42', apiService);
      expect(c.name).toBe('Child');
      expect(c.parentId).toBe('Parent-X');
      expect(c.id).toBe('42');
      expect(c.greet()).toBe('hello 42');
      expect(c.state).toEqual({});
    });

    it('should support overriding log method', () => {
      class Quiet extends SubAgent {
        log() { /* silent */ }
      }
      const q = new Quiet('Q', 'P', apiService);
      const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
      q.log('should be silent');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
