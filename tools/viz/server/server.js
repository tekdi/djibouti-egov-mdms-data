// Minimal dev proxy for CORS and static serving
// Usage: node server.js
// Visit: http://localhost:8001 for the React app

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const serveIndex = require('serve-index');
const fs = require('fs');
const { execFile } = require('child_process');
// Import k8s functionality - graceful fallback if not available
let k8sManager, ServiceConfig, IntentType;
try {
    const k8sModule = require('./k8s');
    k8sManager = k8sModule.k8sManager;
    ServiceConfig = k8sModule.ServiceConfig;
    IntentType = k8sModule.IntentType;
} catch (error) {
    console.log('⚠️  K8s module not available:', error.message);
    console.log('   Kubernetes API endpoints will be disabled');
}

const app = express();
const PORT = process.env.PORT || 8001;
const DEFAULT_TARGET = 'https://djibouti.tekdinext.com';

// Parse JSON bodies
// app.use(express.json());

// CORS for local dev
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, X-Target-URL');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Proxy API requests with dynamic target
app.use('/api', createProxyMiddleware({
    target: DEFAULT_TARGET, // fallback target
    changeOrigin: true,
    pathRewrite: { '^/api': '' },
    router: (req) => {
        // Use target from header if provided, otherwise use default
        const targetFromHeader = req.headers['x-target-url'];
        const target = targetFromHeader || DEFAULT_TARGET;
        console.log(`[PROXY] Using target: ${target} (from ${targetFromHeader ? 'header' : 'default'})`);
        return target;
    },
    onProxyReq: (proxyReq, req, res) => {
        const target = req.headers['x-target-url'] || DEFAULT_TARGET;
        console.log(`[PROXY] ${req.method} ${req.originalUrl} -> ${target}${req.originalUrl.replace(/^\/api/, '')}`);
    },
    onError: (err, req, res) => {
        res.status(500).json({ error: 'Proxy error', details: err.message });
    }
}));

// Serve the built Vite app from Docker container
const reactAppPath = path.join(__dirname, 'public/app');
console.log('Looking for React app at:', reactAppPath);

// Check if React app is built and exists
if (fs.existsSync(reactAppPath)) {
    console.log('✅ React app found - serving from public/app');

    // Serve static assets (CSS, JS, images, etc.) with proper cache headers
    app.use('/assets', express.static(path.join(reactAppPath, 'assets'), {
        maxAge: '1y',
        etag: false
    }));

    // Serve the main app files
    app.use(express.static(reactAppPath, {
        maxAge: '1h',
        etag: false
    }));
} else {
    console.log('⚠️  React app not found at', reactAppPath);
    console.log('   Make sure the React app is built first');
}

// Serve data directory with browsing
const dataPath = path.join(__dirname, '../../..', 'data');
console.log('Data directory:', dataPath);

if (fs.existsSync(dataPath)) {
    app.use('/data', express.static(dataPath), serveIndex(dataPath, {
        'icons': true,
        'view': 'details'
    }));
    console.log('✅ Data directory served at /data');
} else {
    console.log('⚠️  Data directory not found');
}

// === INTENT-BASED KUBERNETES API ENDPOINTS ===

// Parse JSON bodies only for local API routes (not proxy routes)
app.use('/api-local', express.json());

// Helper function to check k8s availability
const requireK8s = (req, res, next) => {
    if (!k8sManager) {
        return res.status(503).json({ error: 'Kubernetes functionality not available' });
    }
    next();
};

// Health check endpoint
app.get('/api-local/k8s/health', requireK8s, async (req, res) => {
    try {
        const health = await k8sManager.healthCheck();
        res.json(health);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available services
app.get('/api-local/k8s/services', requireK8s, (req, res) => {
    try {
        const services = k8sManager.getAvailableServices();
        res.json({
            intent: 'list_available_services',
            count: services.length,
            services
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get available intents
app.get('/api-local/k8s/intents', requireK8s, (req, res) => {
    try {
        const intents = k8sManager.getAvailableIntents();
        res.json({
            intent: 'list_available_intents',
            count: intents.length,
            intents
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Intent: Restart egov-accesscontrol service
app.post('/api-local/intent/restart-egov-accesscontrol', requireK8s, async (req, res) => {
    try {
        const result = await k8sManager.executeIntent_RestartEgovAccesscontrol();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            intent: IntentType.RESTART_EGOV_ACCESSCONTROL,
            error: error.message,
            success: false
        });
    }
});

// Intent: Execute postgres command
app.post('/api-local/intent/postgres-command', requireK8s, async (req, res) => {
    try {
        const { sqlCommand } = req.body;
        if (!sqlCommand) {
            return res.status(400).json({ error: 'sqlCommand is required' });
        }

        const result = await k8sManager.executeIntent_PostgresCommand(sqlCommand);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            intent: IntentType.EXECUTE_POSTGRES_COMMAND,
            error: error.message,
            success: false
        });
    }
});

// Intent: Get service status
app.get('/api-local/intent/service-status/:serviceKey', requireK8s, async (req, res) => {
    try {
        const { serviceKey } = req.params;
        const result = await k8sManager.executeIntent_GetServiceStatus(serviceKey);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            intent: IntentType.GET_SERVICE_STATUS,
            error: error.message,
            success: false
        });
    }
});

// Intent: Get service logs
app.get('/api-local/intent/service-logs/:serviceKey', requireK8s, async (req, res) => {
    try {
        const { serviceKey } = req.params;
        const { tailLines, timestamps } = req.query;

        const options = {
            tailLines: tailLines ? parseInt(tailLines) : 100,
            timestamps: timestamps !== 'false'
        };

        const result = await k8sManager.executeIntent_GetServiceLogs(serviceKey, options);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            intent: IntentType.GET_SERVICE_LOGS,
            error: error.message,
            success: false
        });
    }
});

// Intent: Setup service port forwarding
app.post('/api-local/intent/port-forward/:serviceKey', requireK8s, async (req, res) => {
    try {
        const { serviceKey } = req.params;
        const result = await k8sManager.executeIntent_SetupServicePortForward(serviceKey);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            intent: IntentType.SETUP_SERVICE_PORT_FORWARD,
            error: error.message,
            success: false
        });
    }
});

// === CONVENIENCE ENDPOINTS FOR COMMON OPERATIONS ===

// Quick status check for all critical services
app.get('/api-local/system/critical-services-status', requireK8s, async (req, res) => {
    try {
        const criticalServices = [
            'EGOV_ACCESSCONTROL', 'GATEWAY', 'EGOV_USER', 'EGOV_WORKFLOW_V2',
            'BILLING_SERVICE', 'PROPERTY_SERVICES', 'TL_SERVICES'
        ];

        const statusChecks = await Promise.allSettled(
            criticalServices.map(async (serviceKey) => {
                try {
                    const status = await k8sManager.executeIntent_GetServiceStatus(serviceKey);
                    return { serviceKey, ...status };
                } catch (error) {
                    return {
                        serviceKey,
                        error: error.message,
                        status: 'error'
                    };
                }
            })
        );

        const results = statusChecks.map(result =>
            result.status === 'fulfilled' ? result.value : result.reason
        );

        res.json({
            intent: 'critical_services_status_check',
            timestamp: new Date().toISOString(),
            totalServices: criticalServices.length,
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Database health check with common queries
app.get('/api-local/system/database-health', requireK8s, async (req, res) => {
    try {
        const healthQueries = [
            'SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = \'active\';',
            'SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;',
            'SELECT count(*) as total_users FROM eg_user WHERE active = true;'
        ];

        const queryResults = await Promise.allSettled(
            healthQueries.map(async (query) => {
                try {
                    return await k8sManager.executeIntent_PostgresCommand(query);
                } catch (error) {
                    return { query, error: error.message, success: false };
                }
            })
        );

        const results = queryResults.map(result =>
            result.status === 'fulfilled' ? result.value : result.reason
        );

        res.json({
            intent: 'database_health_check',
            timestamp: new Date().toISOString(),
            results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// === PUBLIC SERVICE WHITELISTED PROXY ===

// Whitelist for public-service APIs
const PUBLIC_SERVICE_WHITELIST = [
    '/public-service/v1/application'
];

// Check if a path is whitelisted for public-service proxy
function isPublicServicePathWhitelisted(path) {
    return PUBLIC_SERVICE_WHITELIST.some(whitelistedPath =>
        path.startsWith(whitelistedPath)
    );
}

// Setup public-service port forward and create whitelisted proxy
app.use('/public-service-proxy', requireK8s, async (req, res, next) => {
    try {
        // Check if the requested path is whitelisted
        if (!isPublicServicePathWhitelisted(req.path)) {
            return res.status(403).json({
                error: 'API endpoint not whitelisted',
                path: req.path,
                whitelistedPaths: PUBLIC_SERVICE_WHITELIST
            });
        }

        // Get the port forward info for PUBLIC_SERVICE
        const portForwardInfo = await k8sManager.executeIntent_SetupServicePortForward('PUBLIC_SERVICE');

        if (!portForwardInfo.localPort) {
            return res.status(500).json({
                error: 'Failed to get port forward information for public-service',
                portForwardInfo
            });
        }

        // Create dynamic proxy to the forwarded port
        const targetUrl = `http://localhost:${portForwardInfo.localPort}`;

        const proxy = createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: {
                '^/public-service-proxy': '' // Remove the proxy prefix
            },
            onError: (err, req, res) => {
                console.error(`Public Service Proxy Error for ${targetUrl}:`, err);
                if (!res.headersSent) {
                    res.status(503).json({
                        error: 'Public service unavailable',
                        target: targetUrl,
                        path: req.path,
                        message: 'Ensure port forwarding is active for public-service'
                    });
                }
            },
            onProxyReq: (proxyReq, req, res) => {
                console.log(`[PUBLIC-SERVICE-PROXY] ${req.method} ${req.path} -> ${targetUrl}${req.path}`);

                // Log headers being forwarded
                console.log(`📋 Headers being forwarded:`);
                Object.keys(req.headers).forEach(headerName => {
                    console.log(`  ${headerName}: ${req.headers[headerName]}`);
                });

                // Explicitly ensure important headers are forwarded
                if (req.headers['auth-token']) {
                    proxyReq.setHeader('auth-token', req.headers['auth-token']);
                }
                if (req.headers['x-tenant-id']) {
                    proxyReq.setHeader('x-tenant-id', req.headers['x-tenant-id']);
                }
                if (req.headers['authorization']) {
                    proxyReq.setHeader('authorization', req.headers['authorization']);
                }
                if (req.headers['content-type']) {
                    proxyReq.setHeader('content-type', req.headers['content-type']);
                }
            }
        });

        proxy(req, res, next);
    } catch (error) {
        console.error('Public Service Proxy Setup Error:', error);
        res.status(500).json({
            error: 'Failed to setup public service proxy',
            message: error.message
        });
    }
});

// Endpoint to get available whitelisted paths
app.get('/api-local/public-service/whitelist', (req, res) => {
    res.json({
        whitelistedPaths: PUBLIC_SERVICE_WHITELIST,
        baseUrl: `http://localhost:${PORT}/public-service-proxy`,
        examples: PUBLIC_SERVICE_WHITELIST.map(path => ({
            path,
            fullUrl: `http://localhost:${PORT}/public-service-proxy${path}`,
            method: 'GET'
        }))
    });
});

// Manually trigger public service port forwarding
app.post('/api-local/public-service/setup-port-forward', async (req, res) => {
    try {
        console.log('🔄 Manually setting up public service port forwarding...');
        const portForwardInfo = await k8sManager.executeIntent_SetupServicePortForward('PUBLIC_SERVICE');
        console.log('✅ Manual port forwarding setup successful:', portForwardInfo);

        res.json({
            success: true,
            message: 'Public service port forwarding setup initiated',
            portForwardInfo,
            instructions: 'Execute the kubectl command shown above in your terminal to activate port forwarding'
        });
    } catch (error) {
        console.error('❌ Manual Public Service Port Forward Error:', error);
        res.status(500).json({
            error: 'Failed to setup public service port forwarding',
            message: error.message,
            instructions: 'Check if public-service pod exists and is running in your Kubernetes cluster'
        });
    }
});

// === API DOCUMENTATION ===

// Serve Swagger YAML specification
app.get('/api-docs/swagger.yaml', (req, res) => {
    const swaggerPath = path.join(__dirname, 'swagger.yaml');
    if (fs.existsSync(swaggerPath)) {
        res.setHeader('Content-Type', 'text/yaml');
        res.sendFile(swaggerPath);
    } else {
        res.status(404).json({ error: 'Swagger specification not found' });
    }
});

// Serve Swagger UI (basic HTML page)
app.get('/api-docs', (req, res) => {
    const swaggerUIHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Djibouti eGov API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui.css" />
    <style>
        html {
            box-sizing: border-box;
            overflow: -moz-scrollbars-vertical;
            overflow-y: scroll;
        }
        *, *:before, *:after {
            box-sizing: inherit;
        }
        body {
            margin:0;
            background: #fafafa;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.10.5/swagger-ui-bundle.js"></script>
    <script>
        window.onload = function() {
            const ui = SwaggerUIBundle({
                url: '/api-docs/swagger.yaml',
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.presets.standalone
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout",
                tryItOutEnabled: true,
                requestInterceptor: function(request) {
                    // Add any default headers here if needed
                    return request;
                }
            });
        }
    </script>
</body>
</html>
    `;
    res.send(swaggerUIHTML);
});

// API documentation info endpoint
app.get('/api-local/docs/info', (req, res) => {
    res.json({
        title: 'Djibouti eGov Visualization Proxy Server',
        version: '1.0.0',
        description: 'Intent-based Kubernetes management and visualization proxy server',
        endpoints: {
            swagger_yaml: `http://localhost:${PORT}/api-docs/swagger.yaml`,
            swagger_ui: `http://localhost:${PORT}/api-docs`,
            openapi_json: `http://localhost:${PORT}/api-docs/openapi.json`
        },
        categories: [
            'kubernetes-health',
            'kubernetes-intents',
            'system-monitoring',
            'public-service-proxy',
            'dynamic-proxy',
            'data-explorer'
        ]
    });
});

// Serve OpenAPI JSON format (converted from YAML)
app.get('/api-docs/openapi.json', (req, res) => {
    const swaggerPath = path.join(__dirname, 'swagger.yaml');
    if (fs.existsSync(swaggerPath)) {
        const yaml = require('js-yaml');
        try {
            const yamlContent = fs.readFileSync(swaggerPath, 'utf8');
            const jsonContent = yaml.load(yamlContent);
            res.json(jsonContent);
        } catch (error) {
            res.status(500).json({ error: 'Failed to convert YAML to JSON', details: error.message });
        }
    } else {
        res.status(404).json({ error: 'Swagger specification not found' });
    }
});

// Handle SPA routing - serve index.html for non-API, non-data routes
app.get('*', (req, res, next) => {
    // Skip if it's an API, data, or file request
    if (req.path.startsWith('/api') ||
        req.path.startsWith('/data') ||
        req.path.startsWith('/api-local') ||
        req.path.startsWith('/public-service-proxy') ||
        req.path.includes('.')) {
        return next();
    }

    // Serve the React app's index.html for SPA routing
    const indexPath = path.join(__dirname, 'public/app', 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('App not found - build the React app first');
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running: http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/`);
    console.log(`📁 Data browser: http://localhost:${PORT}/data`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`   - Swagger UI: GET /api-docs`);
    console.log(`   - OpenAPI YAML: GET /api-docs/swagger.yaml`);
    console.log(`   - OpenAPI JSON: GET /api-docs/openapi.json`);
    console.log(`   - Documentation info: GET /api-local/docs/info`);
    console.log(`🎯 Intent-based API: http://localhost:${PORT}/api-local/intent/`);
    console.log(`   - Available services: GET /api-local/k8s/services`);
    console.log(`   - Available intents: GET /api-local/k8s/intents`);
    console.log(`   - Restart egov-accesscontrol: POST /api-local/intent/restart-egov-accesscontrol`);
    console.log(`   - Postgres command: POST /api-local/intent/postgres-command`);
    console.log(`   - Service status: GET /api-local/intent/service-status/:serviceKey`);
    console.log(`   - Service logs: GET /api-local/intent/service-logs/:serviceKey`);
    console.log(`   - Port forward: POST /api-local/intent/port-forward/:serviceKey`);
    console.log(`🔒 Public Service Proxy: http://localhost:${PORT}/public-service-proxy/`);
    console.log(`   - Whitelisted paths: GET /api-local/public-service/whitelist`);
    console.log(`   - Setup port forwarding: POST /api-local/public-service/setup-port-forward`);
    console.log(`   - Application API: GET /public-service-proxy/public-service/v1/application`);
    console.log(`📈 System checks: http://localhost:${PORT}/api-local/system/`);
    console.log(`   - Critical services: GET /api-local/system/critical-services-status`);
    console.log(`   - Database health: GET /api-local/system/database-health`);
}); 