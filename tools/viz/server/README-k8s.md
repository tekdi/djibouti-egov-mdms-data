# Intent-Based Kubernetes Management for Djibouti eGov Platform

This server provides secure, intent-based Kubernetes management and database operations for the Djibouti eGov platform. All operations are performed through predefined intents rather than raw Kubernetes API access, ensuring safety and consistency.

## 🌐 Dynamic API Proxy

The server includes a dynamic proxy system that allows frontend applications to specify target URLs for API calls:

- **Header-Based Routing**: Use `X-Target-URL` header to specify the target server
- **Default Fallback**: Falls back to `https://djibouti.tekdinext.com` if no header is provided
- **CORS Enabled**: Supports cross-origin requests with proper headers
- **Frontend Integration**: React app includes UI for switching between environments

### Proxy Usage

All API calls to `/api/*` are proxied to the target URL specified in the `X-Target-URL` header:

```bash
# Example: Proxy to local development server
curl -H "X-Target-URL: http://localhost:8080" \
     -H "Content-Type: application/json" \
     http://localhost:8001/api/egov-mdms-service/v2/_search
```

The React frontend automatically includes this header based on user selection in the Target URL selector component.

### Frontend Target URL Management

The React app includes intelligent target URL management with visual environment indicators:

- **Login-Time Selection**: Target URL can only be changed during login, not during an active session
- **Session Protection**: Attempting to change target URL during an authenticated session will automatically log out the user
- **Environment-Specific Tokens**: Authentication tokens are tied to specific environments and won't work across different targets
- **Preset Environments**: Quick selection between Production, Local Development, and Staging environments
- **Custom URLs**: Support for custom target URLs with validation
- **Visual Warnings**: Clear warnings when changing target URL will result in logout
- **Environment Theming**: Visual indicators show current environment with color-coded sidebar borders and environment badges
- **Multi-Location Display**: Current target URL and environment shown in both sidebar and header for constant visibility

### Target URL Behavior

1. **During Login**: Users can freely select between different target environments
2. **During Session**: Target URL changes automatically trigger logout since tokens are environment-specific
3. **Logout Required**: Users must log in again after changing target URL to get a valid token for the new environment

### Visual Environment Indicators

The UI provides clear visual feedback about the current environment:

- **🟢 Local Dev** (localhost/127.0.0.1): Green theme with green left border on sidebar
- **🟡 Staging** (staging domains): Yellow theme with yellow left border on sidebar
- **🔵 Production** (djibouti.tekdinext.com): Blue theme with blue left border on sidebar
- **🟣 Custom** (other URLs): Purple theme with purple left border on sidebar

**Location of Indicators:**

- **Sidebar**: Full target URL display with environment name and color-coded card
- **Header**: Compact environment name with color dot (desktop only)
- **Sidebar Border**: Colored left border indicates environment at a glance
- **Logout Button**: Special red hover state for Production environment as safety reminder

## 🛡️ Security-First Design

- **No Raw K8s API Exposure**: All operations go through controlled intent-based functions
- **Service Port Isolation**: Each service runs on a unique, predefined port
- **Enum-Based Configuration**: Service definitions are centralized and type-safe
- **Command Validation**: Only safe, read-only database queries are allowed
- **Specific Service Targeting**: Operations target exact services by enum keys

## 🎯 Intent-Based Operations

The system supports five main intents:

1. **`RESTART_EGOV_ACCESSCONTROL`** - Restart the egov-accesscontrol service
2. **`EXECUTE_POSTGRES_COMMAND`** - Execute safe SQL queries on postgres
3. **`GET_SERVICE_STATUS`** - Check the health and status of any service
4. **`GET_SERVICE_LOGS`** - Retrieve logs from any service
5. **`SETUP_SERVICE_PORT_FORWARD`** - Setup port forwarding for any service

## 📍 Service Port Mapping

Each service has a unique port assignment to prevent conflicts:

### Core eGov Services (8081-8126)

- `EGOV_ACCESSCONTROL`: 8090
- `BILLING_SERVICE`: 8082
- `EGOV_USER`: 8107
- `EGOV_WORKFLOW_V2`: 8109
- `GATEWAY`: 8110
- `PROPERTY_SERVICES`: 8119
- `TL_SERVICES`: 8125
- _(See ServiceConfig enum for complete mapping)_

### UI Services (3000s)

- `DIGIT_STUDIO`: 3001
- `DIGIT_UI`: 3002
- `CITIZEN`: 3003
- `EMPLOYEE`: 3004

### Database Services

- `POSTGRES`: 5432 (namespace: backbone)

### Monitoring Services

- `CERT_MANAGER`: 9402
- `CERT_MANAGER_WEBHOOK`: 10250

## 🔧 API Endpoints

### Service Discovery

```bash
# Get all available services with their port mappings
GET /api-local/k8s/services

# Get all available intents
GET /api-local/k8s/intents

# Check k8s connection health
GET /api-local/k8s/health
```

### Intent-Based Operations

#### 1. Restart egov-accesscontrol Service

```bash
POST /api-local/intent/restart-egov-accesscontrol

# Response:
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

#### 2. Execute PostgreSQL Command

```bash
POST /api-local/intent/postgres-command
Content-Type: application/json

{
  "sqlCommand": "SELECT count(*) as active_users FROM eg_user WHERE active = true;"
}

# Response:
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

#### 3. Get Service Status

```bash
GET /api-local/intent/service-status/EGOV_ACCESSCONTROL

# Response:
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

#### 4. Get Service Logs

```bash
GET /api-local/intent/service-logs/EGOV_WORKFLOW_V2?tailLines=50&timestamps=true

# Response:
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

#### 5. Setup Port Forwarding

```bash
POST /api-local/intent/port-forward/BILLING_SERVICE

# Response:
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

### System Health Endpoints

#### Critical Services Status

```bash
GET /api-local/system/critical-services-status

# Checks status of: EGOV_ACCESSCONTROL, GATEWAY, EGOV_USER,
# EGOV_WORKFLOW_V2, BILLING_SERVICE, PROPERTY_SERVICES, TL_SERVICES

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
    },
    // ... more services
  ]
}
```

#### Database Health Check

```bash
GET /api-local/system/database-health

# Runs health queries: active connections, database size, user count

{
  "intent": "database_health_check",
  "timestamp": "2024-01-15T10:30:00Z",
  "results": [
    {
      "intent": "execute_postgres_command",
      "command": "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';",
      "output": " active_connections \n-------------------\n                 5\n(1 row)",
      "success": true
    },
    // ... more health checks
  ]
}
```

## 🛠️ Environment Setup

```bash
# Required environment variables
export DB_USER=postgres
export DB_PASSWORD=your_password
export DB_NAME=djibouti_egov
export K8S_NAMESPACE=default  # optional

# Install dependencies
cd tools/viz/server
npm install
npm start
```

## 🔒 Security Features

### Command Validation

- **PostgreSQL**: Only `SELECT`, `SHOW`, and `EXPLAIN` queries allowed
- **Kubernetes**: Only specific, predefined operations permitted
- **No Direct API Access**: All operations go through intent validation

### Service Isolation

- **Unique Ports**: Each service has a dedicated port (no conflicts)
- **Namespace Awareness**: Services are scoped to their correct namespaces
- **Enum-Based Targeting**: Services referenced by safe enum keys, not strings

### Error Handling

- **Comprehensive Logging**: All operations are logged with timestamps
- **Graceful Failures**: Services that are down don't crash the system
- **Detailed Error Messages**: Clear feedback for troubleshooting

## 📝 Usage Examples

### 1. Check System Health

```bash
# Quick check of all critical services
curl http://localhost:8001/api-local/system/critical-services-status

# Database health overview
curl http://localhost:8001/api-local/system/database-health
```

### 2. Restart egov-accesscontrol

```bash
curl -X POST http://localhost:8001/api-local/intent/restart-egov-accesscontrol
```

### 3. Check Database Stats

```bash
curl -X POST http://localhost:8001/api-local/intent/postgres-command \
  -H "Content-Type: application/json" \
  -d '{"sqlCommand": "SELECT count(*) FROM eg_tenant;"}'
```

### 4. Setup Port Forward for Billing Service

```bash
curl -X POST http://localhost:8001/api-local/intent/port-forward/BILLING_SERVICE

# Then execute the returned command:
kubectl port-forward -n default billing-service-6d9cb46c5b-864tk 8082:8080

# Access service at: http://localhost:8082
```

### 5. Monitor Service Logs

```bash
curl "http://localhost:8001/api-local/intent/service-logs/EGOV_WORKFLOW_V2?tailLines=20"
```

## 🎛️ Available Service Keys

Use these exact keys when calling intent APIs:

**Core Services**: `AUDIT_SERVICE`, `BILLING_SERVICE`, `BOUNDARY_SERVICE`, `BPA_CALCULATOR`, `BPA_SERVICES`, `CALCULATOR_SERVICE`, `COLLECTION_SERVICES`, `DASHBOARD_ANALYTICS`, `EGF_MASTER`, `EGOV_ACCESSCONTROL`, `EGOV_APPORTION_SERVICE`, `EGOV_EDCR`, `EGOV_ENC_SERVICE`, `EGOV_FILESTORE`, `EGOV_HRMS`, `EGOV_IDGEN`, `EGOV_INDEXER`, `EGOV_LOCALIZATION`, `EGOV_LOCATION`, `EGOV_NOTIFICATION_MAIL`, `EGOV_NOTIFICATION_SMS`, `EGOV_OTP`, `EGOV_PERSISTER`, `EGOV_PG_SERVICE`, `EGOV_SEARCHER`, `EGOV_URL_SHORTENING`, `EGOV_USER`, `EGOV_USER_EVENT`, `EGOV_WORKFLOW_V2`, `GATEWAY`, `HEALTH_INDIVIDUAL`, `HEALTH_SERVICE_REQUEST`, `INBOX`, `LAND_SERVICES`, `MDMS_V2`, `NOC_SERVICES`, `PDF_SERVICE`, `PGR_SERVICES`, `PROPERTY_SERVICES`, `PUBLIC_SERVICE`, `RAINMAKER_PGR`, `REPORT`, `STUDIO_PDF`, `TL_CALCULATOR`, `TL_SERVICES`, `USER_OTP`

**DIGIT Services**: `DIGIT_STUDIO`, `DIGIT_UI`, `DJIBOUTI_MDMS`

**UI Services**: `CITIZEN`, `EMPLOYEE`

**Database**: `POSTGRES`

**Monitoring**: `CERT_MANAGER`, `CERT_MANAGER_WEBHOOK`, `CERT_MANAGER_CAINJECTOR`

## 🚨 Troubleshooting

### Service Not Found

- Verify the service key exactly matches the enum
- Check if the pod is running: use the status intent first
- Ensure you're using the correct namespace

### Database Connection Issues

- Verify `DB_USER` and `DB_PASSWORD` environment variables
- Check if postgres pod is accessible
- Test with a simple query like `SELECT 1;`

### Port Forward Issues

- Ensure no other service is using the assigned port
- Check if kubectl is properly configured
- Verify pod is in Running state

### Restart Failures

- Check if deployment exists in the specified namespace
- Verify sufficient permissions for deployment operations
- Look for resource constraints or admission controller issues

This intent-based system provides secure, controlled access to your eGov platform while maintaining the flexibility needed for effective operations and monitoring.
