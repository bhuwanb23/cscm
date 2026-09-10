/**
 * E2E Framework Validation Script
 * Validates the structure and correctness of the E2E testing framework
 */

const fs = require('fs');
const path = require('path');

class E2EValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.basePath = path.join(__dirname, '..');
  }

  /**
   * Run all validations
   */
  async validate() {
    console.log('='.repeat(60));
    console.log('E2E Framework Validation');
    console.log('='.repeat(60));

    this.validateDirectoryStructure();
    this.validateConfigFiles();
    this.validateSubAgentFiles();
    this.validateTestRunner();
    this.validatePackageJson();
    this.validateDocumentation();

    this.printResults();

    return this.errors.length === 0;
  }

  /**
   * Validate directory structure
   */
  validateDirectoryStructure() {
    console.log('\n📁 Validating directory structure...');

    const requiredDirs = [
      'e2e/config',
      'e2e/utils',
      'e2e/shopkeeper',
      'e2e/transporter',
      'e2e/wholesaler',
      'e2e/mesh',
      'e2e/integration'
    ];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.basePath, dir);
      if (!fs.existsSync(dirPath)) {
        this.errors.push(`Missing directory: ${dir}`);
        console.log(`  ✗ Missing: ${dir}`);
      } else {
        console.log(`  ✓ Found: ${dir}`);
      }
    }
  }

  /**
   * Validate config files
   */
  validateConfigFiles() {
    console.log('\n⚙️  Validating config files...');

    const configFiles = [
      'e2e/config/test-config.js',
      'e2e/config/api-client.js',
      'e2e/config/test-data.js'
    ];

    for (const file of configFiles) {
      const filePath = path.join(this.basePath, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing config file: ${file}`);
        console.log(`  ✗ Missing: ${file}`);
      } else {
        console.log(`  ✓ Found: ${file}`);
        this.validateConfigFileStructure(filePath);
      }
    }
  }

  /**
   * Validate config file structure
   */
  validateConfigFileStructure(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for required exports
      if (filePath.includes('test-config.js')) {
        if (!content.includes('module.exports')) {
          this.errors.push('test-config.js missing module.exports');
        }
        if (!content.includes('services:')) {
          this.errors.push('test-config.js missing services configuration');
        }
      }
      
      if (filePath.includes('api-client.js')) {
        if (!content.includes('class ApiClient')) {
          this.errors.push('api-client.js missing ApiClient class');
        }
        if (!content.includes('request(')) {
          this.errors.push('api-client.js missing request method');
        }
      }
      
      if (filePath.includes('test-data.js')) {
        if (!content.includes('shopkeepers:')) {
          this.errors.push('test-data.js missing shopkeepers data');
        }
        if (!content.includes('transporters:')) {
          this.errors.push('test-data.js missing transporters data');
        }
      }
    } catch (error) {
      this.errors.push(`Error reading ${filePath}: ${error.message}`);
    }
  }

  /**
   * Validate sub-agent files
   */
  validateSubAgentFiles() {
    console.log('\n🤖 Validating sub-agent files...');

    const subAgentFiles = [
      'e2e/utils/sub-agent-base.js',
      'e2e/utils/shopkeeper-sub-agent.js',
      'e2e/utils/transporter-sub-agent.js',
      'e2e/utils/wholesaler-sub-agent.js',
      'e2e/utils/mesh-sub-agent.js'
    ];

    for (const file of subAgentFiles) {
      const filePath = path.join(this.basePath, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing sub-agent file: ${file}`);
        console.log(`  ✗ Missing: ${file}`);
      } else {
        console.log(`  ✓ Found: ${file}`);
        this.validateSubAgentStructure(filePath);
      }
    }
  }

  /**
   * Validate sub-agent structure
   */
  validateSubAgentStructure(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Check for class definition
      if (!content.includes('class ')) {
        this.errors.push(`${path.basename(filePath)} missing class definition`);
      }
      
      // Check for extends BaseSubAgent (except base class itself)
      if (!filePath.includes('sub-agent-base.js') && !content.includes('extends BaseSubAgent')) {
        this.errors.push(`${path.basename(filePath)} should extend BaseSubAgent`);
      }
      
      // Check for test methods
      if (filePath.includes('sub-agent-base.js')) {
        if (!content.includes('async login()')) {
          this.errors.push('sub-agent-base.js missing login method');
        }
        if (!content.includes('getTestMethods()')) {
          this.errors.push('sub-agent-base.js missing getTestMethods method');
        }
      } else {
        if (!content.includes('test') || !content.includes('Workflow')) {
          this.warnings.push(`${path.basename(filePath)} may be missing test workflow methods`);
        }
      }
    } catch (error) {
      this.errors.push(`Error reading ${filePath}: ${error.message}`);
    }
  }

  /**
   * Validate test runner
   */
  validateTestRunner() {
    console.log('\n🏃 Validating test runner...');

    const runnerPath = path.join(this.basePath, 'e2e/e2e-runner.js');
    
    if (!fs.existsSync(runnerPath)) {
      this.errors.push('Missing test runner: e2e/e2e-runner.js');
      console.log('  ✗ Missing: e2e/e2e-runner.js');
      return;
    }
    
    console.log('  ✓ Found: e2e/e2e-runner.js');
    
    try {
      const content = fs.readFileSync(runnerPath, 'utf8');
      
      if (!content.includes('class E2ETestRunner')) {
        this.errors.push('e2e-runner.js missing E2ETestRunner class');
      }
      
      if (!content.includes('runAllTests()')) {
        this.errors.push('e2e-runner.js missing runAllTests method');
      }
      
      if (!content.includes('runRoleTests()')) {
        this.errors.push('e2e-runner.js missing runRoleTests method');
      }
      
      if (!content.includes('runIntegrationTests()')) {
        this.errors.push('e2e-runner.js missing runIntegrationTests method');
      }
      
      // Check for sub-agent imports
      const requiredImports = [
        'ShopkeeperSubAgent',
        'TransporterSubAgent',
        'WholesalerSubAgent',
        'MeshConsoleSubAgent'
      ];
      
      for (const imp of requiredImports) {
        if (!content.includes(imp)) {
          this.errors.push(`e2e-runner.js missing import: ${imp}`);
        }
      }
    } catch (error) {
      this.errors.push(`Error reading e2e-runner.js: ${error.message}`);
    }
  }

  /**
   * Validate package.json
   */
  validatePackageJson() {
    console.log('\n📦 Validating package.json...');

    const packagePath = path.join(this.basePath, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      this.errors.push('Missing package.json');
      return;
    }
    
    try {
      const content = fs.readFileSync(packagePath, 'utf8');
      const packageJson = JSON.parse(content);
      
      if (!packageJson.scripts) {
        this.errors.push('package.json missing scripts section');
      } else if (!packageJson.scripts['test:e2e']) {
        this.errors.push('package.json missing test:e2e script');
      } else {
        console.log('  ✓ Found test:e2e script');
      }
    } catch (error) {
      this.errors.push(`Error reading package.json: ${error.message}`);
    }
  }

  /**
   * Validate documentation
   */
  validateDocumentation() {
    console.log('\n📚 Validating documentation...');

    const readmePath = path.join(this.basePath, 'e2e/README.md');
    
    if (!fs.existsSync(readmePath)) {
      this.warnings.push('Missing documentation: e2e/README.md');
      console.log('  ⚠ Missing: e2e/README.md');
      return;
    }
    
    console.log('  ✓ Found: e2e/README.md');
    
    try {
      const content = fs.readFileSync(readmePath, 'utf8');
      
      // Check for required sections
      const requiredSections = [
        'Overview',
        'Architecture',
        'Running Tests',
        'Test Coverage'
      ];
      
      for (const section of requiredSections) {
        if (!content.includes(section)) {
          this.warnings.push(`README.md missing section: ${section}`);
        }
      }
    } catch (error) {
      this.errors.push(`Error reading README.md: ${error.message}`);
    }
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ All validations passed!');
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
const validator = new E2EValidator();
validator.validate()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });

module.exports = E2EValidator;
