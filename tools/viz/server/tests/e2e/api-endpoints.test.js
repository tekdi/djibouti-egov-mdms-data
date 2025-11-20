const request = require('supertest');
const { spawn } = require('child_process');
const path = require('path');

describe('Real API Endpoints E2E Tests', () => {
    let serverProcess;
    let app;
    const TEST_PORT = 8002;

    beforeAll(async () => {
        // Start the actual server on a test port
        const serverPath = path.join(__dirname, '../../server.js');

        console.log('🚀 Starting real server for testing...');

        return new Promise((resolve, reject) => {
            // Set environment variable for test port
            const env = { ...process.env, PORT: TEST_PORT.toString() };

            serverProcess = spawn('node', [serverPath], {
                env,
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let serverReady = false;

            serverProcess.stdout.on('data', (data) => {
                const output = data.toString();
                if (process.env.VERBOSE_TESTS) {
                    console.log('SERVER:', output);
                }

                // Wait for server to be ready
                if (output.includes('Server running:') && !serverReady) {
                    serverReady = true;
                    console.log(`✅ Test server ready on port ${TEST_PORT}`);
                    // Use the base URL for supertest
                    app = `http://localhost:${TEST_PORT}`;
                    setTimeout(resolve, 1000); // Give it a moment to fully initialize
                }
            });

            serverProcess.stderr.on('data', (data) => {
                const error = data.toString();
                if (process.env.VERBOSE_TESTS) {
                    console.log('SERVER ERROR:', error);
                }
            });

            serverProcess.on('error', (error) => {
                console.error('❌ Failed to start server:', error);
                reject(error);
            });

            // Timeout if server doesn't start
            const timeout = setTimeout(() => {
                if (!serverReady) {
                    reject(new Error('Server failed to start within timeout'));
                }
            }, 30000);

            // Clear timeout when server starts
            if (serverReady) {
                clearTimeout(timeout);
            }
        });
    });

    afterAll(async () => {
        if (serverProcess) {
            console.log('🛑 Stopping test server...');
            serverProcess.kill('SIGTERM');

            // Wait for graceful shutdown
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    serverProcess.kill('SIGKILL');
                    resolve();
                }, 5000);

                serverProcess.on('close', () => {
                    console.log('✅ Test server stopped');
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
    });

    describe('Service Discovery & Health', () => {
        test('GET /api-local/k8s/health - should return k8s health status', async () => {
            const response = await request(app)
                .get('/api-local/k8s/health');

            // Should return either success or error, but valid JSON
            expect([200, 503]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/json/);
            expect(testUtils.isValidK8sHealth(response.body)).toBe(true);
        });

        test('GET /api-local/k8s/services - should return services list or error', async () => {
            const response = await request(app)
                .get('/api-local/k8s/services');

            expect([200, 503]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/json/);

            if (response.status === 200) {
                expect(testUtils.isValidServiceList(response.body)).toBe(true);
                expect(response.body.services.length).toBeGreaterThan(0);
            } else {
                testUtils.validateErrorResponse(response, 503);
            }
        });

        test('GET /api-local/k8s/intents - should return intents list or error', async () => {
            const response = await request(app)
                .get('/api-local/k8s/intents');

            expect([200, 503]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/json/);

            if (response.status === 200) {
                expect(testUtils.isValidIntentList(response.body)).toBe(true);
                expect(response.body.intents.length).toBeGreaterThan(0);
            } else {
                testUtils.validateErrorResponse(response, 503);
            }
        });
    });

    describe('Intent-Based Operations', () => {
        test('POST /api-local/intent/restart-egov-accesscontrol - should handle restart request', async () => {
            const response = await request(app)
                .post('/api-local/intent/restart-egov-accesscontrol');

            expect([200, 500, 503]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/json/);

            if (response.status === 200) {
                testUtils.validateResponseStructure(response, ['intent', 'service']);
                expect(response.body.intent).toBe('restart_egov_accesscontrol');
            } else {
                expect(response.body).toHaveProperty('error');
            }
        });

        test('POST /api-local/intent/postgres-command - should handle SQL commands', async () => {
            const testCommands = testUtils.getTestSqlCommands();

            for (const sqlCommand of testCommands.slice(0, 1)) { // Test only first command to save time
                const response = await request(app)
                    .post('/api-local/intent/postgres-command')
                    .send({ sqlCommand });

                expect([200, 500, 503]).toContain(response.status);
                expect(response.headers['content-type']).toMatch(/json/);

                if (response.status === 200) {
                    testUtils.validateResponseStructure(response, ['intent', 'success']);
                    expect(response.body.intent).toBe('execute_postgres_command');
                } else {
                    expect(response.body).toHaveProperty('error');
                }
            }
        });

        test('POST /api-local/intent/postgres-command - should reject empty command', async () => {
            const response = await request(app)
                .post('/api-local/intent/postgres-command')
                .send({});

            testUtils.validateErrorResponse(response, 400);
            expect(response.body.error).toBe('sqlCommand is required');
        });

        test('GET /api-local/intent/service-status/:serviceKey - should return service status', async () => {
            const testServices = testUtils.getTestServiceKeys();

            for (const serviceKey of testServices.slice(0, 1)) { // Test only first service to save time
                const response = await request(app)
                    .get(`/api-local/intent/service-status/${serviceKey}`);

                expect([200, 500, 503]).toContain(response.status);
                expect(response.headers['content-type']).toMatch(/json/);
                expect(testUtils.isValidServiceStatus(response.body)).toBe(true);
            }
        });

        test('GET /api-local/intent/service-logs/:serviceKey - should return service logs', async () => {
            const response = await request(app)
                .get('/api-local/intent/service-logs/EGOV_ACCESSCONTROL?tailLines=10&timestamps=true');

            expect([200, 500, 503]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/json/);

            if (response.status === 200) {
                testUtils.validateResponseStructure(response, ['intent']);
                expect(response.body.intent).toBe('get_service_logs');
            } else {
                expect(response.body).toHaveProperty('error');
            }
        });

        test('POST /api-local/intent/port-forward/:serviceKey - should handle port forward requests', async () => {
            const response = await request(app)
                .post('/api-local/intent/port-forward/BILLING_SERVICE');

            expect([200, 500, 503]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/json/);

            if (response.status === 200) {
                testUtils.validateResponseStructure(response, ['intent']);
                expect(response.body.intent).toBe('setup_service_port_forward');
            } else {
                expect(response.body).toHaveProperty('error');
            }
        });
    });

    describe('System Health Monitoring', () => {
        test('GET /api-local/system/critical-services-status - should check critical services', async () => {
            const response = await request(app)
                .get('/api-local/system/critical-services-status');

            expect([200, 500, 503]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/json/);

            if (response.status === 200) {
                testUtils.validateResponseStructure(response, ['intent', 'timestamp', 'results']);
                expect(response.body.intent).toBe('critical_services_status_check');
                expect(Array.isArray(response.body.results)).toBe(true);
            } else {
                expect(response.body).toHaveProperty('error');
            }
        });

        test('GET /api-local/system/database-health - should check database health', async () => {
            const response = await request(app)
                .get('/api-local/system/database-health');

            expect([200, 500, 503]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/json/);

            if (response.status === 200) {
                testUtils.validateResponseStructure(response, ['intent', 'timestamp', 'results']);
                expect(response.body.intent).toBe('database_health_check');
                expect(Array.isArray(response.body.results)).toBe(true);
            } else {
                expect(response.body).toHaveProperty('error');
            }
        });
    });

    describe('Public Service Proxy', () => {
        test('GET /api-local/public-service/whitelist - should return whitelisted paths', async () => {
            const response = await request(app)
                .get('/api-local/public-service/whitelist');

            testUtils.validateApiResponse(response, 200);
            testUtils.validateResponseStructure(response, ['whitelistedPaths', 'baseUrl', 'examples']);
            expect(Array.isArray(response.body.whitelistedPaths)).toBe(true);
            expect(response.body.whitelistedPaths.length).toBeGreaterThan(0);
        });

        test('GET /public-service-proxy/invalid/path - should return 403 for non-whitelisted path', async () => {
            const response = await request(app)
                .get('/public-service-proxy/invalid/path');

            expect([403, 500, 503]).toContain(response.status);
            expect(response.headers['content-type']).toMatch(/json/);

            if (response.status === 403) {
                expect(response.body.error).toContain('not whitelisted');
            }
        });
    });

    describe('API Documentation', () => {
        test('GET /api-local/docs/info - should return documentation info', async () => {
            const response = await request(app)
                .get('/api-local/docs/info');

            testUtils.validateApiResponse(response, 200);
            testUtils.validateResponseStructure(response, ['title', 'version', 'endpoints', 'categories']);
            expect(response.body.title).toContain('Djibouti eGov');
        });

        test('GET /api-docs/swagger.yaml - should return swagger YAML', async () => {
            const response = await request(app)
                .get('/api-docs/swagger.yaml');

            expect([200, 404]).toContain(response.status);

            if (response.status === 200) {
                expect(response.headers['content-type']).toContain('text/yaml');
                expect(response.text).toContain('openapi:');
            }
        });

        test('GET /api-docs/openapi.json - should return OpenAPI JSON', async () => {
            const response = await request(app)
                .get('/api-docs/openapi.json');

            expect([200, 404, 500]).toContain(response.status);

            if (response.status === 200) {
                testUtils.validateApiResponse(response, 200);
                testUtils.validateResponseStructure(response, ['openapi', 'info', 'paths']);
            }
        });

        test('GET /api-docs - should return Swagger UI HTML', async () => {
            const response = await request(app)
                .get('/api-docs');

            expect(response.status).toBe(200);
            expect(response.text).toContain('swagger-ui');
        });
    });

    describe('Error Handling & CORS', () => {
        test('GET /api-local/non-existent - should return 404', async () => {
            const response = await request(app)
                .get('/api-local/non-existent');

            expect(response.status).toBe(404);
        });

        test('POST with invalid JSON - should handle gracefully', async () => {
            const response = await request(app)
                .post('/api-local/intent/postgres-command')
                .send('invalid json')
                .set('Content-Type', 'application/json');

            expect([400, 500]).toContain(response.status);
        });

        test('OPTIONS request - should return CORS headers', async () => {
            const response = await request(app)
                .options('/api-local/k8s/health');

            expect(response.status).toBe(200);
            expect(response.headers['access-control-allow-origin']).toBe('*');
            expect(response.headers['access-control-allow-methods']).toContain('GET');
        });

        test('GET request - should include CORS headers', async () => {
            const response = await request(app)
                .get('/api-local/docs/info');

            expect(response.headers['access-control-allow-origin']).toBe('*');
        });
    });
}); 