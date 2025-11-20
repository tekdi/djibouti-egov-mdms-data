# Testing Guide for Djibouti eGov Visualization Server

This directory contains comprehensive e2e and unit tests for the Djibouti eGov Visualization Server API endpoints.

## 📁 Test Structure

```
tests/
├── README.md              # This file
├── setup.js               # Global test configuration and utilities
├── run-tests.js           # Custom test runner with multiple modes
├── curl-commands.md       # CURL examples for manual testing
├── e2e/                   # End-to-end tests
│   ├── api-endpoints.test.js       # Main API endpoint tests
│   └── k8s-unavailable.test.js     # Tests without Kubernetes
├── unit/                  # Unit tests (future)
└── fixtures/              # Test data and mocks
    └── data/              # Sample data files
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd tools/viz/server
npm install
```

### 2. Run All Tests

```bash
npm test
```

### 3. Run Specific Test Types

```bash
# E2E tests only
npm run test:e2e

# With coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### 4. Using Custom Test Runner

```bash
# Run all tests
node tests/run-tests.js

# Run only e2e tests
node tests/run-tests.js e2e

# Run with coverage
node tests/run-tests.js coverage

# Show help
node tests/run-tests.js help
```

## 🧪 Test Categories

### End-to-End Tests (`tests/e2e/`)

#### `api-endpoints.test.js` - Main API Testing

Tests all server endpoints with mocked Kubernetes backend:

- **Service Discovery & Health** (3 endpoints)

  - `GET /api-local/k8s/health`
  - `GET /api-local/k8s/services`
  - `GET /api-local/k8s/intents`

- **Intent-Based Operations** (5 endpoints)

  - `POST /api-local/intent/restart-egov-accesscontrol`
  - `POST /api-local/intent/postgres-command`
  - `GET /api-local/intent/service-status/:serviceKey`
  - `GET /api-local/intent/service-logs/:serviceKey`
  - `POST /api-local/intent/port-forward/:serviceKey`

- **System Health Monitoring** (2 endpoints)

  - `GET /api-local/system/critical-services-status`
  - `GET /api-local/system/database-health`

- **Public Service Proxy** (2 endpoints)

  - `GET /api-local/public-service/whitelist`
  - `GET /public-service-proxy/*` (with whitelisting)

- **API Documentation** (4 endpoints)

  - `GET /api-local/docs/info`
  - `GET /api-docs/swagger.yaml`
  - `GET /api-docs/openapi.json`
  - `GET /api-docs` (Swagger UI)

- **Dynamic Proxy**

  - `GET /api/*` with `X-Target-URL` header routing

- **Error Handling & CORS**
  - Invalid endpoints, malformed JSON, CORS headers

#### `k8s-unavailable.test.js` - Graceful Degradation

Tests server behavior when Kubernetes is not available:

- All K8s-dependent endpoints return 503
- Non-K8s endpoints continue working
- CORS headers still function
- Proper error messages

## 🛠️ Test Configuration

### Environment Variables

Tests use these environment variables:

```bash
NODE_ENV=test          # Set automatically
PORT=8002              # Test server port (different from main)
SILENT_TESTS=true      # Optional: Reduce console noise
```

### Jest Configuration

Configured in `package.json`:

```json
{
  "testEnvironment": "node",
  "testTimeout": 30000,
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"]
}
```

### Test Utilities (`tests/setup.js`)

Global utilities available in all tests:

- `testUtils.validateResponseStructure()` - Validate API response fields
- `testUtils.createMockApplicationResponse()` - Generate mock application data
- `testUtils.createMockK8sHealth()` - Generate mock K8s health responses
- `testUtils.createMockServiceStatus()` - Generate mock service status

## 🎯 Testing Strategy

### Mocking Strategy

- **Kubernetes API**: Fully mocked to avoid dependency on real cluster
- **HTTP Requests**: Mocked using `nock` for proxy testing
- **Server Lifecycle**: Each test suite starts/stops its own server instance
- **Port Isolation**: Each test suite uses different ports to avoid conflicts

### Test Data

- Mock responses match real API response structures
- Test data includes realistic eGov application data
- Fixtures can be extended for specific test scenarios

### Error Testing

- Invalid endpoints (404 errors)
- Malformed JSON payloads (400 errors)
- Missing required fields (400 errors)
- Kubernetes unavailable scenarios (503 errors)
- Non-whitelisted proxy paths (403 errors)

## 📖 Manual Testing with CURL

For manual API testing, see [`curl-commands.md`](./curl-commands.md) which provides:

- Complete CURL examples for every endpoint
- Expected response formats
- Error testing scenarios
- Common service keys for testing
- Testing workflows (health checks, service management, database operations)

## 🔧 Development Workflow

### Adding New Tests

1. Create test files in appropriate directory (`e2e/` or `unit/`)
2. Follow naming convention: `*.test.js`
3. Use global `testUtils` for common operations
4. Mock external dependencies (K8s, HTTP calls)
5. Include both success and error scenarios

### Running Tests During Development

```bash
# Watch mode - runs tests on file changes
npm run test:watch

# Run specific test file
npx jest tests/e2e/api-endpoints.test.js

# Run tests matching pattern
npx jest --testNamePattern="Service Discovery"
```

### Debugging Tests

```bash
# Verbose output
npx jest --verbose

# Run single test with full output
npx jest --testNamePattern="should return cluster health" --verbose

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📊 Coverage Reports

Generate coverage reports:

```bash
npm run test:coverage
```

Coverage reports are saved in `coverage/` directory:

- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools
- `coverage/coverage-final.json` - JSON format

Target coverage goals:

- **Lines**: > 80%
- **Functions**: > 80%
- **Branches**: > 70%
- **Statements**: > 80%

## 🚨 Troubleshooting

### Common Issues

**Tests hanging or not exiting:**

```bash
# Use forceExit option (already configured)
npx jest --forceExit
```

**Port conflicts:**

```bash
# Kill processes using test ports
lsof -ti:8002,8003 | xargs kill -9
```

**Module mocking issues:**

```bash
# Clear Jest cache
npx jest --clearCache
```

**Kubernetes connection errors in tests:**

- Tests should run without real K8s connection
- Check that K8s module is properly mocked
- Verify test isolation (each suite uses own server)

### Test Environment Setup

1. **Node.js**: Requires Node.js 16+
2. **Dependencies**: Run `npm install` to install test dependencies
3. **Kubernetes**: Tests don't require real K8s cluster (mocked)
4. **Database**: Database operations are mocked in tests

### CI/CD Integration

For continuous integration:

```bash
# Run tests in CI mode
npm run test:e2e
npm run test:coverage

# Generate coverage reports
npm run test:coverage

# Export results in different formats
npx jest --outputFile=test-results.json --json
```

## 📝 Best Practices

### Writing Tests

- **Descriptive Names**: Use clear, descriptive test names
- **Isolated Tests**: Each test should be independent
- **Mock External Dependencies**: Don't rely on external services
- **Test Both Success and Failure**: Include error scenarios
- **Use Test Utilities**: Leverage `testUtils` for common operations

### Test Organization

- **Group Related Tests**: Use `describe` blocks for logical grouping
- **Clear Setup/Teardown**: Use `beforeAll`/`afterAll` for resource management
- **Consistent Structure**: Follow the same pattern across test files

### Maintenance

- **Update Tests with Code Changes**: Keep tests in sync with API changes
- **Review Coverage Reports**: Identify untested code paths
- **Mock Data Evolution**: Update mock responses when real API changes
- **Performance Monitoring**: Monitor test execution time

---

## 🔗 Related Documentation

- [`curl-commands.md`](./curl-commands.md) - Manual testing examples
- [`../README-k8s.md`](../README-k8s.md) - Server API documentation
- [`../swagger.yaml`](../swagger.yaml) - OpenAPI specification
- [`../package.json`](../package.json) - Test scripts and dependencies
