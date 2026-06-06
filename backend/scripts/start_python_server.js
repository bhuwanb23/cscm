/**
 * Spawn the ai-ml FastAPI uvicorn server, wait until it accepts
 * connections, and expose a handle for clean shutdown.
 *
 * Two modes:
 *   1) Library  - require('./start_python_server') and call start(options)
 *   2) CLI      - node scripts/start_python_server.js [--port 8000] [--keep]
 *                 The CLI starts the server, waits for ready, and (by default)
 *                 kills it on SIGINT/SIGTERM. With --keep it stays running
 *                 until killed externally.
 *
 * Options:
 *   aiMlDir      path to the ai-ml repo (default: ../ai-ml relative to backend)
 *   pythonPath   path to python executable (default: <aiMlDir>/venv/Scripts/python.exe on win,
 *                <aiMlDir>/venv/bin/python on posix)
 *   port         uvicorn port (default: 8000, or $AI_ML_API_PORT)
 *   host         uvicorn host (default: 127.0.0.1)
 *   healthPath   GET path to poll for readiness (default: /health)
 *   readyTimeoutMs   how long to wait for ready (default: 60000)
 *   pollIntervalMs   how often to poll (default: 250)
 *   log          function(level, msg) for child log lines (default: console)
 *   stdio       how to wire child stdio (default: 'inherit' in CLI, 'pipe' as lib)
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const DEFAULT_HEALTH_PATH = '/health';
const DEFAULT_READY_TIMEOUT_MS = 120000;
const DEFAULT_POLL_INTERVAL_MS = 250;

function defaultPythonPath(aiMlDir, platform) {
  const bin = platform === 'win32' ? 'Scripts' : 'bin';
  return path.join(aiMlDir, 'venv', bin, platform === 'win32' ? 'python.exe' : 'python');
}

function defaultLog(level, msg) {
  const tag = level === 'error' ? '[python-server][error]' : `[python-server][${level}]`;
  if (level === 'error') console.error(`${tag} ${msg}`);
  else console.log(`${tag} ${msg}`);
}

function start(options = {}) {
  const platform = process.platform;
  const aiMlDir = options.aiMlDir
    || process.env.AI_ML_DIR
    || path.resolve(__dirname, '..', '..', 'ai-ml');
  const pythonPath = options.pythonPath
    || process.env.AI_ML_PYTHON
    || defaultPythonPath(aiMlDir, platform);
  const port = options.port
    || (process.env.AI_ML_API_PORT ? parseInt(process.env.AI_ML_API_PORT, 10) : 8000);
  const host = options.host || '127.0.0.1';
  const healthPath = options.healthPath || DEFAULT_HEALTH_PATH;
  const readyTimeoutMs = options.readyTimeoutMs || DEFAULT_READY_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs || DEFAULT_POLL_INTERVAL_MS;
  const log = options.log || defaultLog;
  const stdio = options.stdio != null ? options.stdio : 'inherit';

  if (!fs.existsSync(pythonPath)) {
    const err = new Error(
      `Python interpreter not found at ${pythonPath}. ` +
      `Set AI_ML_PYTHON or pass pythonPath explicitly.`
    );
    err.code = 'PYTHON_NOT_FOUND';
    return Promise.reject(err);
  }
  if (!fs.existsSync(path.join(aiMlDir, 'api', 'main.py'))) {
    const err = new Error(
      `ai-ml api/main.py not found under ${aiMlDir}. ` +
      `Set AI_ML_DIR or pass aiMlDir explicitly.`
    );
    err.code = 'AIML_NOT_FOUND';
    return Promise.reject(err);
  }

  const args = ['-u', '-m', 'api._run_server', host, String(port)];
  log('info', `Spawning: ${pythonPath} ${args.join(' ')}  (cwd=${aiMlDir})`);

  const proc = spawn(pythonPath, args, { cwd: aiMlDir, stdio });

  if (proc.stdout && typeof proc.stdout.on === 'function') {
    proc.stdout.on('data', (d) => log('info', `[uvicorn stdout] ${d.toString().trimEnd()}`));
  }
  if (proc.stderr && typeof proc.stderr.on === 'function') {
    proc.stderr.on('data', (d) => log('info', `[uvicorn stderr] ${d.toString().trimEnd()}`));
  }

  proc.on('error', (err) => log('error', `spawn error: ${err.message}`));
  proc.on('exit', (code, signal) => log('info', `uvicorn exited code=${code} signal=${signal}`));

  const kill = (signal = 'SIGTERM') => {
    if (proc.exitCode != null) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => resolve();
      proc.once('exit', done);
      try {
        proc.kill(signal);
      } catch (e) {
        log('error', `kill error: ${e.message}`);
        resolve();
      }
      setTimeout(() => {
        if (proc.exitCode == null) {
          log('info', 'uvicorn did not exit on SIGTERM, sending SIGKILL');
          try { proc.kill('SIGKILL'); } catch (_) { /* ignore */ }
        }
      }, 5000).unref();
    });
  };

  const probe = () => new Promise((resolve, reject) => {
    const req = http.request({
      host, port, path: healthPath, method: 'GET', timeout: 1500,
    }, (res) => {
      res.resume();
      if (res.statusCode >= 200 && res.statusCode < 500) resolve(res.statusCode);
      else reject(new Error(`status ${res.statusCode}`));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(new Error('health probe timeout')); });
    req.end();
  });

  const ready = (async () => {
    const startTs = Date.now();
    let lastErr = null;
    while (Date.now() - startTs < readyTimeoutMs) {
      if (proc.exitCode != null) {
        throw new Error(`uvicorn exited with code ${proc.exitCode} before becoming ready`);
      }
      try {
        const status = await probe();
        log('info', `Ready (HTTP ${status}) after ${Date.now() - startTs}ms on http://${host}:${port}`);
        return { host, port, healthPath, status };
      } catch (e) {
        lastErr = e;
      }
      await new Promise((r) => setTimeout(r, pollIntervalMs));
    }
    await kill('SIGTERM');
    throw new Error(
      `uvicorn failed to become ready within ${readyTimeoutMs}ms ` +
      `(last error: ${lastErr ? lastErr.message : 'unknown'})`
    );
  })();

  return Promise.resolve({ proc, kill, ready, host, port });
}

async function runCli(argv) {
  const args = argv.slice(2);
  let port;
  let keep = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--port' || a === '-p') { port = parseInt(args[++i], 10); }
    else if (a === '--keep' || a === '-k') { keep = true; }
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/start_python_server.js [--port 8000] [--keep]');
      process.exit(0);
    } else if (!a.startsWith('-')) {
      port = parseInt(a, 10);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  const handle = await start(port ? { port } : {});
  const shutdown = async (sig) => {
    console.log(`[python-server] received ${sig}, shutting down...`);
    await handle.kill('SIGTERM');
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  if (keep) {
    console.log(`[python-server] running on http://${handle.host}:${handle.port} (--keep, kill externally)`);
  }
  await handle.ready;
  if (!keep) {
    console.log(`[python-server] ready, waiting for signals to exit. Use --keep to leave running.`);
    setInterval(() => {}, 1 << 30);
  }
}

if (require.main === module) {
  runCli(process.argv).catch((err) => {
    console.error(`[python-server] FATAL: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { start };
