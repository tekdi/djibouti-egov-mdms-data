# CURL Commands Reference for Djibouti eGov Visualization Server

This document provides CURL commands for testing all API endpoints in the Djibouti eGov Visualization Server.

**Base URL**: `http://localhost:8001` (or whatever port your server is running on)

## 🔍 Service Discovery & Health

### Check Kubernetes Health

```bash
curl -X GET http://localhost:8001/api-local/k8s/health
```

**Expected Response:**

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "cluster": "production-cluster"
}
```

### Get Available Services

```bash
curl -X GET http://localhost:8001/api-local/k8s/services
```

**Expected Response:**

```json
{
  "intent": "list_available_services",
  "count": 50,
  "services": [
    { "key": "EGOV_ACCESSCONTROL", "name": "egov-accesscontrol", "port": 8090 },
    { "key": "BILLING_SERVICE", "name": "billing-service", "port": 8082 }
  ]
}
```

### Get Available Intents

```bash
curl -X GET http://localhost:8001/api-local/k8s/intents
```

**Expected Response:**

```json
{
  "intent": "list_available_intents",
  "count": 5,
  "intents": [
    "restart_egov_accesscontrol",
    "execute_postgres_command",
    "get_service_status",
    "get_service_logs",
    "setup_service_port_forward"
  ]
}
```

## 🎯 Intent-Based Operations

### Restart egov-accesscontrol Service

```bash
curl -X POST http://localhost:8001/api-local/intent/restart-egov-accesscontrol
```

**Expected Response:**

```json
{
  "intent": "restart_egov_accesscontrol",
  "service": "egov-accesscontrol",
  "namespace": "default",
  "deploymentName": "egov-accesscontrol",
  "restarted": true,
  "restartedAt": "2024-01-15T10:30:00Z",
  "currentReplicas": 1,
  "message": "Successfully restarted egov-accesscontrol"
}
```

### Execute PostgreSQL Command

```bash
curl -X POST http://localhost:8001/api-local/intent/postgres-command \
  -H "Content-Type: application/json" \
  -d '{"sqlCommand": "SELECT count(*) as active_users FROM eg_user WHERE active = true;"}'
```

**Expected Response:**

```json
{
  "intent": "execute_postgres_command",
  "service": "postgres-postgresql-0",
  "namespace": "backbone",
  "command": "SELECT count(*) as active_users FROM eg_user WHERE active = true;",
  "output": " active_users \n--------------\n         1250\n(1 row)",
  "success": true,
  "executedAt": "2024-01-15T10:30:00Z"
}
```

### Get Service Status

```bash
curl -X GET http://localhost:8001/api-local/intent/service-status/EGOV_ACCESSCONTROL
```

**Expected Response:**

```json
{
  "intent": "get_service_status",
  "service": "egov-accesscontrol",
  "namespace": "default",
  "podName": "egov-accesscontrol-bddd98589-zhxs2",
  "status": "Running",
  "ready": true,
  "restarts": 0,
  "created": "2024-01-15T09:00:00Z",
  "assignedPort": 8090,
  "healthCheckUrl": "http://localhost:8090/health"
}
```

### Get Service Logs

```bash
# Basic logs
curl -X GET http://localhost:8001/api-local/intent/service-logs/EGOV_WORKFLOW_V2

# With parameters
curl -X GET "http://localhost:8001/api-local/intent/service-logs/EGOV_WORKFLOW_V2?tailLines=50&timestamps=true"
```

**Expected Response:**

```json
{
  "intent": "get_service_logs",
  "service": "egov-workflow-v2",
  "namespace": "default",
  "podName": "egov-workflow-v2-657dc4768f-wc5xd",
  "logs": "2024-01-15T10:30:00Z INFO: Application started...",
  "options": { "tailLines": 50, "timestamps": true },
  "retrievedAt": "2024-01-15T10:30:00Z"
}
```

### Setup Port Forwarding

```bash
curl -X POST http://localhost:8001/api-local/intent/port-forward/BILLING_SERVICE
```

**Expected Response:**

```json
{
  "intent": "setup_service_port_forward",
  "service": "billing-service",
  "namespace": "default",
  "podName": "billing-service-6d9cb46c5b-864tk",
  "localPort": 8082,
  "remotePort": 8080,
  "command": "kubectl port-forward -n default billing-service-6d9cb46c5b-864tk 8082:8080",
  "url": "http://localhost:8082",
  "message": "Port forward setup for billing-service",
  "instructions": "Execute this command in your terminal: kubectl port-forward ..."
}
```

## 📈 System Health Monitoring

### Critical Services Status

```bash
curl -X GET http://localhost:8001/api-local/system/critical-services-status
```

**Expected Response:**

```json
{
  "intent": "critical_services_status_check",
  "timestamp": "2024-01-15T10:30:00Z",
  "totalServices": 7,
  "results": [
    {
      "serviceKey": "EGOV_ACCESSCONTROL",
      "intent": "get_service_status",
      "service": "egov-accesscontrol",
      "status": "Running",
      "ready": true,
      "assignedPort": 8090
    }
  ]
}
```

### Database Health Check

```bash
curl -X GET http://localhost:8001/api-local/system/database-health
```

**Expected Response:**

```json
{
  "intent": "database_health_check",
  "timestamp": "2024-01-15T10:30:00Z",
  "results": [
    {
      "intent": "execute_postgres_command",
      "command": "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';",
      "output": " active_connections \n-------------------\n                 5\n(1 row)",
      "success": true
    }
  ]
}
```

## 🔒 Public Service Proxy

### Get Whitelisted Paths

```bash
curl -X GET http://localhost:8001/api-local/public-service/whitelist
```

**Expected Response:**

```json
{
  "whitelistedPaths": ["/public-service/v1/application"],
  "baseUrl": "http://localhost:8001/public-service-proxy",
  "examples": [
    {
      "path": "/public-service/v1/application",
      "fullUrl": "http://localhost:8001/public-service-proxy/public-service/v1/application",
      "method": "GET"
    }
  ]
}
```

### Access Public Service Application API

```bash
curl -X GET http://localhost:8001/public-service-proxy/public-service/v1/application \
  -H "X-Tenant-Id: dj"
```

**Expected Response:**

```json
{
  "ResponseInfo": {
    "apiId": "application.search",
    "ver": "1.0",
    "ts": "2024-01-15T10:30:00Z",
    "resMsgId": "abc123",
    "msgId": "def456",
    "status": "successful"
  },
  "Applications": [
    {
      "id": "app-001",
      "tenantId": "dj",
      "applicationNumber": "APP-2024-001",
      "serviceCode": "NOC",
      "status": "APPLIED"
    }
  ]
}
```

### Test Non-Whitelisted Path (Should Return 403)

```bash
curl -X GET http://localhost:8001/public-service-proxy/unauthorized/endpoint
```

**Expected Response (403):**

```json
{
  "error": "API endpoint not whitelisted",
  "path": "/unauthorized/endpoint",
  "whitelistedPaths": ["/public-service/v1/application"]
}
```

## 🌐 Dynamic Proxy

### Proxy with Custom Target URL

```bash
curl -X GET http://localhost:8001/api/egov-mdms-service/v2/_search \
  -H "X-Target-URL: http://localhost:8080" \
  -H "Content-Type: application/json"
```

### Proxy with Default Target

```bash
curl -X GET http://localhost:8001/api/egov-mdms-service/v2/_search \
  -H "Content-Type: application/json"
```

## 📚 API Documentation

### Get Documentation Info

```bash
curl -X GET http://localhost:8001/api-local/docs/info
```

**Expected Response:**

```json
{
  "title": "Djibouti eGov Visualization Proxy Server",
  "version": "1.0.0",
  "description": "Intent-based Kubernetes management and visualization proxy server",
  "endpoints": {
    "swagger_yaml": "http://localhost:8001/api-docs/swagger.yaml",
    "swagger_ui": "http://localhost:8001/api-docs",
    "openapi_json": "http://localhost:8001/api-docs/openapi.json"
  }
}
```

### Get Swagger YAML

```bash
curl -X GET http://localhost:8001/api-docs/swagger.yaml
```

### Get OpenAPI JSON

```bash
curl -X GET http://localhost:8001/api-docs/openapi.json
```

### Access Swagger UI

```bash
# Open in browser
open http://localhost:8001/api-docs
# or
curl -X GET http://localhost:8001/api-docs
```

## 📁 Data Explorer

### Browse Data Directory

```bash
curl -X GET http://localhost:8001/data/
```

### Get Specific Data File

```bash
curl -X GET http://localhost:8001/data/dj/tenant/tenants.json
```

## 🚨 Error Testing

### Test Non-Existent Endpoint

```bash
curl -X GET http://localhost:8001/api-local/non-existent
```

**Expected Response (404):**

```json
{
  "error": "Not found"
}
```

### Test Invalid JSON

```bash
curl -X POST http://localhost:8001/api-local/intent/postgres-command \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```

**Expected Response (400):**

```json
{
  "error": "Invalid JSON"
}
```

### Test Missing Required Field

```bash
curl -X POST http://localhost:8001/api-local/intent/postgres-command \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response (400):**

```json
{
  "error": "sqlCommand is required"
}
```

## 🔄 CORS Testing

### Test CORS Preflight

```bash
curl -X OPTIONS http://localhost:8001/api-local/k8s/health \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: Content-Type"
```

## 📝 Common Service Keys for Testing

Use these service keys with the intent endpoints:

**Core Services:**

- `EGOV_ACCESSCONTROL`
- `BILLING_SERVICE`
- `EGOV_USER`
- `EGOV_WORKFLOW_V2`
- `GATEWAY`
- `PROPERTY_SERVICES`
- `TL_SERVICES`

**Example Usage:**

```bash
# Check status of different services
curl -X GET http://localhost:8001/api-local/intent/service-status/EGOV_USER
curl -X GET http://localhost:8001/api-local/intent/service-status/GATEWAY
curl -X GET http://localhost:8001/api-local/intent/service-status/PROPERTY_SERVICES

# Setup port forwarding for different services
curl -X POST http://localhost:8001/api-local/intent/port-forward/EGOV_USER
curl -X POST http://localhost:8001/api-local/intent/port-forward/TL_SERVICES
```

## 🎛️ Environment Variables for Testing

When testing with different configurations, you can set these environment variables:

```bash
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_NAME=djibouti_egov
export K8S_NAMESPACE=default
export NODE_ENV=development
```

## 🧪 Testing Scenarios

### 1. Full Health Check Workflow

```bash
# 1. Check if k8s is available
curl -X GET http://localhost:8001/api-local/k8s/health

# 2. Get available services
curl -X GET http://localhost:8001/api-local/k8s/services

# 3. Check critical services
curl -X GET http://localhost:8001/api-local/system/critical-services-status

# 4. Check database health
curl -X GET http://localhost:8001/api-local/system/database-health
```

### 2. Service Management Workflow

```bash
# 1. Check service status
curl -X GET http://localhost:8001/api-local/intent/service-status/EGOV_ACCESSCONTROL

# 2. Get service logs
curl -X GET http://localhost:8001/api-local/intent/service-logs/EGOV_ACCESSCONTROL?tailLines=20

# 3. Setup port forwarding
curl -X POST http://localhost:8001/api-local/intent/port-forward/EGOV_ACCESSCONTROL

# 4. Restart service if needed
curl -X POST http://localhost:8001/api-local/intent/restart-egov-accesscontrol
```

### 3. Database Operations Workflow

```bash
# 1. Check connection count
curl -X POST http://localhost:8001/api-local/intent/postgres-command \
  -H "Content-Type: application/json" \
  -d '{"sqlCommand": "SELECT count(*) FROM pg_stat_activity;"}'

# 2. Check database size
curl -X POST http://localhost:8001/api-local/intent/postgres-command \
  -H "Content-Type: application/json" \
  -d '{"sqlCommand": "SELECT pg_size_pretty(pg_database_size(current_database()));"}'

# 3. Check user count
curl -X POST http://localhost:8001/api-local/intent/postgres-command \
  -H "Content-Type: application/json" \
  -d '{"sqlCommand": "SELECT count(*) FROM eg_user WHERE active = true;"}'
```

---

**Note**: Replace `localhost:8001` with your actual server URL and port. All examples assume the server is running and Kubernetes is available. When Kubernetes is unavailable, k8s-dependent endpoints will return 503 status codes.
