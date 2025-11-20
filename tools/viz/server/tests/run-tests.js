#!/usr/bin/env node

/**
 * Test Runner for Djibouti eGov Visualization Server
 * 
 * Usage:
 *   node tests/run-tests.js [mode]
 * 
 * Modes:
 *   all     - Run all tests (default)
 *   e2e     - Run only e2e tests
 *   unit    - Run only unit tests
 *   watch   - Run tests in watch mode
 *   coverage - Run tests with coverage report
 */

const { spawn } = require('child_process');
const path = require('path');

const modes = {
    all: ['--testPathPattern=.*\\.test\\.js$'],
    e2e: ['--testPathPattern=e2e'],
    unit: ['--testPathPattern=unit'],
    watch: ['--watch'],
    coverage: ['--coverage']
};

function runTests(args) {
    const jest = path.join(__dirname, '../node_modules/.bin/jest');

    console.log('🧪 Starting Djibouti eGov Server Tests...');
    console.log(`📍 Test directory: ${__dirname}`);
    console.log(`🔧 Jest args: ${args.join(' ')}\n`);

    const testProcess = spawn('node', [jest, ...args, '--detectOpenHandles', '--forceExit'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });

    testProcess.on('close', (code) => {
        if (code === 0) {
            console.log('\n✅ All tests passed!');
        } else {
            console.log(`\n❌ Tests failed with exit code ${code}`);
        }
        process.exit(code);
    });

    testProcess.on('error', (error) => {
        console.error('❌ Failed to start test process:', error);
        process.exit(1);
    });
}

function showHelp() {
    console.log(`
🧪 Djibouti eGov Server Test Runner

Usage: node tests/run-tests.js [mode]

Available modes:
  all        Run all tests (default)
  e2e        Run only end-to-end tests
  unit       Run only unit tests  
  watch      Run tests in watch mode
  coverage   Run tests with coverage report

Examples:
  node tests/run-tests.js
  node tests/run-tests.js e2e
  node tests/run-tests.js coverage
  node tests/run-tests.js watch

Other useful commands:
  npm test                  - Run all tests
  npm run test:e2e         - Run e2e tests
  npm run test:coverage    - Run with coverage
  npm run test:watch       - Watch mode

Before running tests:
1. Make sure dependencies are installed: npm install
2. Ensure the server can start (check k8s connection if testing with real cluster)
3. Set environment variables if needed (see tests/curl-commands.md)

Test files locations:
- E2E tests: tests/e2e/
- Unit tests: tests/unit/
- Test utilities: tests/setup.js
- CURL examples: tests/curl-commands.md
`);
}

// Parse command line arguments
const mode = process.argv[2] || 'all';

if (mode === 'help' || mode === '-h' || mode === '--help') {
    showHelp();
    process.exit(0);
}

if (!modes[mode]) {
    console.error(`❌ Unknown mode: ${mode}`);
    console.error('Available modes:', Object.keys(modes).join(', '));
    console.error('Use "help" for more information');
    process.exit(1);
}

// Run the tests
runTests(modes[mode]); 