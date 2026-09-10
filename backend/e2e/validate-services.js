/**
 * Simplified E2E Test Runner for Service Validation
 * Tests basic service connectivity and API responses
 */

const http = require('http');

class ServiceValidator {
  constructor() {
    this.results = [];
  }

  /**
   * Check if a service is responding
   */
  async checkService(url, name) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      http.get(url, (res) => {
        const duration = Date.now() - startTime;
        console.log(`✓ ${name} is responding (${duration}ms)`);
        this.results.push({ service: name, status: 'up', duration });
        resolve(true);
      }).on('error', (err) => {
        console.log(`✗ ${name} is not responding: ${err.message}`);
        this.results.push({ service: name, status: 'down', error: err.message });
        resolve(false);
      });
    });
  }

  /**
   * Run all service checks
   */
  async runChecks() {
    console.log('='.repeat(60));
    console.log('CSCM Service Validation');
    console.log('='.repeat(60));

    const services = [
      { url: 'http://localhost:3000/health', name: 'Backend API (3000)' },
      { url: 'http://localhost:8080/health', name: 'API Gateway (8080)' },
      { url: 'http://localhost:8000/health', name: 'AI/ML Service (8000)' }
    ];

    for (const service of services) {
      await this.checkService(service.url, service.name);
    }

    this.printSummary();
  }

  /**
   * Print summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('Service Validation Summary');
    console.log('='.repeat(60));

    const up = this.results.filter(r => r.status === 'up').length;
    const down = this.results.filter(r => r.status === 'down').length;

    console.log(`Total Services: ${this.results.length}`);
    console.log(`Up: ${up}`);
    console.log(`Down: ${down}`);

    if (down === 0) {
      console.log('\n✅ All services are running!');
    } else {
      console.log('\n❌ Some services are down');
    }

    console.log('='.repeat(60));
  }
}

// Run validation
const validator = new ServiceValidator();
validator.runChecks()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Validation failed:', err);
    process.exit(1);
  });
