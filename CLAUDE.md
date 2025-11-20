# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the Djibouti eGov MDMS (Master Data Management Service) repository that contains configuration data for the eGov platform. The project has three main components:

1. **MDMS Data**: JSON configuration files organized by tenant (dj, pg, default) containing master data for various eGov modules
2. **Visualization Tools (React App)**: Frontend application for visualizing and managing workflows, localization, and role-action mappings
3. **Proxy Server**: Node.js/Express server providing API proxying, Kubernetes management, and database operations

## Common Development Commands

### Docker Operations
```bash
# Build and run the MDMS service
docker build -t djibouti-mdms .
docker run -p 8001:8001 djibouti-mdms
```

### Frontend Development (Visualization Tools)
```bash
cd tools/viz/app

# Install dependencies
npm install

# Development server (runs on port 5173)
npm run dev

# Build for production
npm run build

# Lint check
npm run lint

# Preview production build
npm run preview
```

### Backend Server (Proxy/K8s Management)
```bash
cd tools/viz/server

# Setup environment
npm run setup  # Installs deps, creates .env from sample

# Development mode
npm run dev

# Production mode
npm start

# Run tests
npm test
npm run test:watch
npm run test:coverage
npm run test:e2e
```

## Architecture & Structure

### Repository Layout
```
/
├── data/                    # MDMS JSON configuration files
│   ├── default/            # Default tenant configurations
│   ├── dj/                 # Djibouti tenant configurations  
│   └── pg/                 # PG tenant configurations
├── tools/viz/              # Visualization and management tools
│   ├── app/                # React frontend application
│   │   ├── src/pages/      # Application pages (Dashboard, Workflow, etc.)
│   │   └── src/components/ # Reusable UI components
│   └── server/             # Express proxy server
│       ├── server.js       # Main server with proxy configuration
│       └── k8s.js          # Kubernetes management utilities
├── master-config.json      # Master configuration for all MDMS modules
└── Dockerfile              # Container configuration
```

### Key Architectural Patterns

#### Frontend (React App)
- **UI Framework**: React 19 with TypeScript, using Vite as build tool
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: Zustand for global state
- **Routing**: React Router v7 for navigation
- **Data Visualization**: D3.js for workflow diagrams, Monaco Editor for JSON editing
- **Forms**: React Hook Form with Zod validation
- **Tables**: TanStack Table for data grids

#### Backend Server
- **Proxy Pattern**: Dynamic proxy routing with `X-Target-URL` header support
- **Intent-Based K8s Operations**: Secure Kubernetes management through predefined intents:
  - `RESTART_EGOV_ACCESSCONTROL`
  - `EXECUTE_POSTGRES_COMMAND`
  - `GET_SERVICE_STATUS`
  - `GET_SERVICE_LOGS`
  - `SETUP_SERVICE_PORT_FORWARD`
- **Service Port Mapping**: Each service has a unique port (8081-8126 for core services)
- **API Documentation**: Swagger/OpenAPI available at `/api-docs`

#### MDMS Data Structure
- **Tenant-Based Organization**: Data organized by tenant (dj, pg, default)
- **Module Configuration**: Each module has its own directory with JSON configs
- **Master Config**: `master-config.json` defines unique keys and state-level flags
- **Key Modules**:
  - ACCESSCONTROL: Roles and role-action mappings
  - BillingService: Tax heads and business service configurations
  - PropertyTax: Property tax configurations
  - Workflow: Business service workflows
  - egov-location: Boundary and location data

### Critical Services & Ports

**Core eGov Services**: 
- egov-accesscontrol (8090)
- billing-service (8082) 
- egov-user (8107)
- egov-workflow-v2 (8109)
- gateway (8110)

**UI Services**:
- digit-studio (3001)
- digit-ui (3002)
- citizen (3003)
- employee (3004)

**Database**:
- postgres (5432, namespace: backbone)

### Development Best Practices

1. **Port Management**: Always check if ports are available before starting servers (especially 8001 for proxy server)

2. **Data Access**: Data is available both via APIs and as files in the repository - consider both when making changes

3. **Environment Configuration**: 
   - Frontend can switch between environments using the Target URL selector
   - Authentication tokens are environment-specific
   - Visual indicators show current environment (color-coded borders)

4. **Testing Changes**:
   - Test MDMS data changes locally before committing
   - Use the visualization tools to validate workflow and role-action configurations
   - Run server tests before deploying proxy changes

5. **Security Considerations**:
   - No raw Kubernetes API exposure - use intent-based operations only
   - PostgreSQL queries limited to SELECT, SHOW, EXPLAIN
   - Service isolation through unique port assignments

### Key Files to Understand

- `/master-config.json`: Defines the structure and validation rules for all MDMS modules
- `/tools/viz/server/server.js`: Main proxy server with API routing
- `/tools/viz/server/k8s.js`: Kubernetes management utilities
- `/tools/viz/app/src/pages/WorkflowVisualizer.tsx`: Workflow visualization logic
- `/tools/viz/app/src/pages/RoleActionVisualizer.tsx`: Role-action mapping interface
- `/data/dj/Workflow/BusinessService.json`: Workflow configurations for Djibouti tenant
- `/data/dj/ACCESSCONTROL-ROLEACTIONS/roleactions.json`: Role-action mappings

### Environment Variables

For the proxy server (`tools/viz/server`):
```bash
DB_USER=postgres
DB_PASSWORD=your_password  
DB_NAME=djibouti_egov
K8S_NAMESPACE=default
```

### API Endpoints

Key API endpoints provided by the proxy server:

- `/api/*` - Dynamic proxy to target environment
- `/api-local/k8s/services` - List available services
- `/api-local/intent/*` - Intent-based Kubernetes operations
- `/api-local/system/critical-services-status` - Health check
- `/api-docs` - Swagger documentation
- `/public-service-proxy/*` - Whitelisted public service access