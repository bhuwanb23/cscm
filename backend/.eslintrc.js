module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:node/recommended',
    'plugin:promise/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'import',
    'node',
    'promise'
  ],
  rules: {
    'indent': 'off', // Disabled for existing codebase with mixed indentation
    'linebreak-style': 'off', // Disabled to handle mixed line endings
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'no-unused-vars': 'warn',
    'no-console': 'off',
    'no-undef': 'error',
    
    // Security rules (manual)
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-script-url': 'error',
    
    // Import rules (relaxed for existing codebase)
    'import/order': 'off', // Disabled due to existing codebase issues
    'import/no-unresolved': 'off',
    'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
    
    // Node.js rules
    'node/no-unpublished-require': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    'node/no-process-env': 'off', // Disabled for existing codebase
    'node/no-path-concat': 'error',
    'node/shebang': 'off', // Disabled for executable scripts
    'no-process-exit': 'off', // Disabled for existing codebase
    'node/no-unsupported-features/node-builtins': 'off', // Disabled for modern Node.js features
    'node/no-missing-require': 'off', // Disabled for existing codebase
    
    // Promise rules (relaxed for existing codebase)
    'promise/always-return': 'off', // Disabled for existing codebase
    'promise/no-return-wrap': 'error',
    'promise/prefer-await-to-then': 'off', // Disabled for existing codebase
    'promise/catch-or-return': 'off', // Disabled for existing codebase
    
    // Complexity rules
    'complexity': ['warn', 30], // Increased threshold
    'max-depth': ['warn', 8], // Increased threshold
    'max-lines-per-function': 'off', // Disabled for existing codebase
    'max-params': ['warn', 10], // Increased threshold
    
    // Additional disabled rules for existing codebase
    'no-unreachable': 'off', // Disabled for existing codebase
    
    // Consistency rules
    'consistent-return': 'off', // Disabled for existing codebase
    'no-else-return': 'off', // Disabled for existing codebase
    'prefer-const': 'warn', // Changed to warning
    'no-var': 'error'
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.json']
      }
    }
  }
};