// Test setup and configuration for real API testing
const path = require('path');
const fs = require('fs');

// Set test environment variables
process.env.NODE_ENV = 'test';

// Reduce console noise during testing (optional)
if (process.env.SILENT_TESTS === 'true') {
    global.console = {
        ...console,
        log: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
    };
}

// Global test timeout - longer for real API calls
jest.setTimeout(60000);

// Setup before all tests
beforeAll(async () => {
    // Ensure test data directory exists
    const testDataPath = path.join(__dirname, 'fixtures', 'data');
    if (!fs.existsSync(testDataPath)) {
        fs.mkdirSync(testDataPath, { recursive: true });

        // Create some test data files
        fs.writeFileSync(
            path.join(testDataPath, 'test.json'),
            JSON.stringify({ test: 'data' })
        );
    }
});

// Cleanup after all tests
afterAll(async () => {
    // Cleanup any test artifacts if needed
    const testDataPath = path.join(__dirname, 'fixtures', 'data');
    if (fs.existsSync(testDataPath)) {
        fs.rmSync(testDataPath, { recursive: true, force: true });
    }
});

// Common test utilities for real API testing
global.testUtils = {
    // Validate that response has expected fields
    validateResponseStructure: (response, expectedFields) => {
        expectedFields.forEach(field => {
            expect(response.body).toHaveProperty(field);
        });
    },

    // Validate common response patterns
    validateApiResponse: (response, expectedStatus = 200) => {
        expect(response.status).toBe(expectedStatus);
        expect(response.headers['content-type']).toMatch(/json/);
    },

    // Validate error response structure
    validateErrorResponse: (response, expectedStatus, expectedErrorField = 'error') => {
        expect(response.status).toBe(expectedStatus);
        expect(response.body).toHaveProperty(expectedErrorField);
        expect(typeof response.body[expectedErrorField]).toBe('string');
    },

    // Check if response looks like a valid kubernetes health response
    isValidK8sHealth: (responseBody) => {
        if (!responseBody || typeof responseBody !== 'object') {
            return false;
        }

        // Should have either a status field OR an error field
        return (responseBody.status !== undefined) || (responseBody.error !== undefined);
    },

    // Check if response looks like a valid service list
    isValidServiceList: (responseBody) => {
        return responseBody &&
            responseBody.intent === 'list_available_services' &&
            Array.isArray(responseBody.services);
    },

    // Check if response looks like a valid intent list  
    isValidIntentList: (responseBody) => {
        return responseBody &&
            responseBody.intent === 'list_available_intents' &&
            Array.isArray(responseBody.intents);
    },

    // Check if response looks like a service status response
    isValidServiceStatus: (responseBody) => {
        return responseBody &&
            (responseBody.intent === 'get_service_status' || responseBody.error);
    },

    // Common service keys for testing
    getTestServiceKeys: () => [
        'EGOV_ACCESSCONTROL',
        'BILLING_SERVICE',
        'EGOV_USER',
        'GATEWAY'
    ],

    // Common SQL commands for testing
    getTestSqlCommands: () => [
        'SELECT 1;',
        'SELECT current_database();',
        'SELECT version();'
    ]
}; 