#!/usr/bin/env node

/**
 * Redis Availability Check Script
 * 
 * This script checks if Redis is available on the system.
 */

const { spawn } = require('child_process');

function checkRedisCli() {
  return new Promise((resolve) => {
    const redisCli = spawn('redis-cli', ['ping'], { timeout: 5000 });
    
    let output = '';
    let errorOutput = '';
    
    redisCli.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    redisCli.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    redisCli.on('close', (code) => {
      if (code === 0 && output.trim() === 'PONG') {
        resolve({ available: true, method: 'redis-cli' });
      } else {
        resolve({ available: false, method: 'redis-cli', error: errorOutput || 'Not available' });
      }
    });
    
    redisCli.on('error', () => {
      resolve({ available: false, method: 'redis-cli', error: 'Command not found' });
    });
  });
}

function checkDockerRedis() {
  return new Promise((resolve) => {
    const docker = spawn('docker', ['ps'], { timeout: 5000 });
    
    let output = '';
    let errorOutput = '';
    
    docker.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    docker.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    docker.on('close', (code) => {
      if (code === 0 && output.includes('redis')) {
        resolve({ available: true, method: 'docker', details: 'Redis container running' });
      } else {
        resolve({ available: false, method: 'docker', error: errorOutput || 'No Redis container found' });
      }
    });
    
    docker.on('error', () => {
      resolve({ available: false, method: 'docker', error: 'Docker not available' });
    });
  });
}

async function checkRedisAvailability() {
  console.log('Checking Redis availability...\n');
  
  // Check if redis-cli is available
  const cliResult = await checkRedisCli();
  console.log(`Redis CLI check: ${cliResult.available ? '✓ Available' : '✗ Not available'}`);
  if (cliResult.error) {
    console.log(`  Error: ${cliResult.error}`);
  }
  
  // Check if Docker Redis container is running
  const dockerResult = await checkDockerRedis();
  console.log(`Docker Redis check: ${dockerResult.available ? '✓ Available' : '✗ Not available'}`);
  if (dockerResult.details) {
    console.log(`  Details: ${dockerResult.details}`);
  }
  if (dockerResult.error) {
    console.log(`  Error: ${dockerResult.error}`);
  }
  
  console.log('\n--- Recommendations ---');
  if (cliResult.available || dockerResult.available) {
    console.log('✓ Redis is available on your system');
    console.log('You can now run the CSCM backend with Redis messaging support');
  } else {
    console.log('✗ Redis is not available on your system');
    console.log('Please install Redis using one of these methods:');
    console.log('1. Install Docker and run: docker run -d -p 6379:6379 --name cscm-redis redis:latest');
    console.log('2. Install Redis natively on your system');
    console.log('3. Refer to src/messaging/REDIS_SETUP.md for detailed installation instructions');
  }
}

// Run check if script is executed directly
if (require.main === module) {
  checkRedisAvailability();
}

module.exports = { checkRedisAvailability };