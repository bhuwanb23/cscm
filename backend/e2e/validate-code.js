/**
 * Code Syntax and Structure Validation
 * Validates that all E2E framework files have correct syntax and can be loaded
 */

const fs = require('fs');
const path = require('path');

class CodeValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.basePath = path.join(__dirname, '..');
  }

  /**
   * Run all code validations
   */
  async validate() {
    console.log('='.repeat(60));
    console.log('Code Syntax and Structure Validation');
    console.log('='.repeat(60));

    this.validateConfigFiles();
    this.validateSubAgentFiles();
    this.validateTestRunner();

    this.printResults();

    return this.errors.length === 0;
  }

  /**
   * Validate config files can be loaded
   */
  validateConfigFiles() {
    console.log('\n⚙️  Validating config files...');

    const configFiles = [
      { path: 'e2e/config/test-config.js', check: (module) => module.services && module.timeouts },
      { path: 'e2e/config/api-client.js', check: (module) => module.prototype && module.prototype.request },
      { path: 'e2e/config/test-data.js', check: (module) => module.shopkeepers && module.transporters }
    ];

    for (const { path: filePath, check } of configFiles) {
      const fullPath = path.join(this.basePath, filePath);
      try {
        delete require.cache[require.resolve(fullPath)];
        const module = require(fullPath);
        
        if (check(module)) {
          console.log(`  ✓ ${filePath} - valid structure`);
        } else {
          this.errors.push(`${filePath} - invalid structure`);
          console.log(`  ✗ ${filePath} - invalid structure`);
        }
      } catch (error) {
        this.errors.push(`${filePath} - ${error.message}`);
        console.log(`  ✗ ${filePath} - ${error.message}`);
      }
    }
  }

  /**
   * Validate sub-agent files can be loaded
   */
  validateSubAgentFiles() {
    console.log('\n🤖 Validating sub-agent files...');

    const subAgentFiles = [
      { path: 'e2e/utils/sub-agent-base.js', class: 'BaseSubAgent' },
      { path: 'e2e/utils/shopkeeper-sub-agent.js', class: 'ShopkeeperSubAgent' },
      { path: 'e2e/utils/transporter-sub-agent.js', class: 'TransporterSubAgent' },
      { path: 'e2e/utils/wholesaler-sub-agent.js', class: 'WholesalerSubAgent' },
      { path: 'e2e/utils/mesh-sub-agent.js', class: 'MeshConsoleSubAgent' }
    ];

    for (const { path: filePath, class: className } of subAgentFiles) {
      const fullPath = path.join(this.basePath, filePath);
      try {
        delete require.cache[require.resolve(fullPath)];
        const module = require(fullPath);
        
        // Check if the module exports the class directly or as default
        const ClassConstructor = module.default || module;
        
        if (ClassConstructor && (ClassConstructor.name === className || typeof ClassConstructor === 'function')) {
          const instance = new ClassConstructor('test-id');
          
          // Check for required methods
          const requiredMethods = ['initialize', 'login', 'validateResponse', 'cleanup', 'getTestMethods'];
          const optionalMethods = ['performAction', 'loadRoleSpecificData'];
          const missingMethods = requiredMethods.filter(method => typeof instance[method] !== 'function');
          
          if (missingMethods.length === 0) {
            console.log(`  ✓ ${filePath} - all required methods present`);
          } else {
            this.warnings.push(`${filePath} - missing methods: ${missingMethods.join(', ')}`);
            console.log(`  ⚠ ${filePath} - missing methods: ${missingMethods.join(', ')}`);
          }
        } else {
          this.errors.push(`${filePath} - missing class ${className}`);
          console.log(`  ✗ ${filePath} - missing class ${className}`);
        }
      } catch (error) {
        this.errors.push(`${filePath} - ${error.message}`);
        console.log(`  ✗ ${filePath} - ${error.message}`);
      }
    }
  }

  /**
   * Validate test runner can be loaded
   */
  validateTestRunner() {
    console.log('\n🏃 Validating test runner...');

    const runnerPath = path.join(this.basePath, 'e2e/e2e-runner.js');
    try {
      delete require.cache[require.resolve(runnerPath)];
      const module = require(runnerPath);
      
      const ClassConstructor = module.default || module;
      
      if (ClassConstructor && (ClassConstructor.name === 'E2ETestRunner' || typeof ClassConstructor === 'function')) {
        console.log(`  ✓ e2e/e2e-runner.js - valid structure`);
      } else {
        this.errors.push('e2e/e2e-runner.js - missing E2ETestRunner class');
        console.log(`  ✗ e2e/e2e-runner.js - missing E2ETestRunner class`);
      }
    } catch (error) {
      this.errors.push(`e2e/e2e-runner.js - ${error.message}`);
      console.log(`  ✗ e2e/e2e-runner.js - ${error.message}`);
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('CODE VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All code validations passed!');
    } else {
      if (this.errors.length > 0) {
        console.log(`\n❌ Errors (${this.errors.length}):`);
        for (const error of this.errors) {
          console.log(`  - ${error}`);
        }
      }
      
      if (this.warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
        for (const warning of this.warnings) {
          console.log(`  - ${warning}`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run validation
const validator = new CodeValidator();
validator.validate()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Code validation failed:', error);
    process.exit(1);
  });

module.exports = CodeValidator;
