#!/usr/bin/env node
/**
 * Cross-platform wrapper: sets INTEGRATION_TEST=1 and runs the
 * integration test suite. Avoids the cross-env dep.
 *
 * Usage: node scripts/run_integration_tests.js
 *        npm run test:integration
 */
process.env.INTEGRATION_TEST = '1';

const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const jestBin = path.join(__dirname, '..', 'node_modules', 'jest', 'bin', 'jest.js');

const args = [jestBin, 'src/tests/integration/', '--runInBand', '--colors'];
const child = spawn(process.execPath, args, {
  stdio: 'inherit',
  env: process.env,
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code == null ? 1 : code);
});
