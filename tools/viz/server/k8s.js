// Load environment variables from .env file
require('dotenv').config();

const k8s = require('@kubernetes/client-node');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Service definitions and port mappings
const ServiceConfig = {
    // Core eGov services
    AUDIT_SERVICE: { name: 'audit-service', port: 8081, namespace: 'egov' },
    BILLING_SERVICE: { name: 'billing-service', port: 8082, namespace: 'egov' },
    BOUNDARY_SERVICE: { name: 'boundary-service', port: 8083, namespace: 'egov' },
    BPA_CALCULATOR: { name: 'bpa-calculator', port: 8084, namespace: 'egov' },
    BPA_SERVICES: { name: 'bpa-services', port: 8085, namespace: 'egov' },
    CALCULATOR_SERVICE: { name: 'calculator-service', port: 8086, namespace: 'egov' },
    COLLECTION_SERVICES: { name: 'collection-services', port: 8087, namespace: 'egov' },
    DASHBOARD_ANALYTICS: { name: 'dashboard-analytics', port: 8088, namespace: 'egov' },
    EGF_MASTER: { name: 'egf-master', port: 8089, namespace: 'egov' },
    EGOV_ACCESSCONTROL: { name: 'egov-accesscontrol', port: 8090, namespace: 'egov' },
    EGOV_APPORTION_SERVICE: { name: 'egov-apportion-service', port: 8091, namespace: 'egov' },
    EGOV_EDCR: { name: 'egov-edcr', port: 8092, namespace: 'egov' },
    EGOV_ENC_SERVICE: { name: 'egov-enc-service', port: 8093, namespace: 'egov' },
    EGOV_FILESTORE: { name: 'egov-filestore', port: 8094, namespace: 'egov' },
    EGOV_HRMS: { name: 'egov-hrms', port: 8095, namespace: 'egov' },
    EGOV_IDGEN: { name: 'egov-idgen', port: 8096, namespace: 'egov' },
    EGOV_INDEXER: { name: 'egov-indexer', port: 8097, namespace: 'egov' },
    EGOV_LOCALIZATION: { name: 'egov-localization', port: 8098, namespace: 'egov' },
    EGOV_LOCATION: { name: 'egov-location', port: 8099, namespace: 'egov' },
    EGOV_NOTIFICATION_MAIL: { name: 'egov-notification-mail', port: 8100, namespace: 'egov' },
    EGOV_NOTIFICATION_SMS: { name: 'egov-notification-sms', port: 8101, namespace: 'egov' },
    EGOV_OTP: { name: 'egov-otp', port: 8102, namespace: 'egov' },
    EGOV_PERSISTER: { name: 'egov-persister', port: 8103, namespace: 'egov' },
    EGOV_PG_SERVICE: { name: 'egov-pg-service', port: 8104, namespace: 'egov' },
    EGOV_SEARCHER: { name: 'egov-searcher', port: 8105, namespace: 'egov' },
    EGOV_URL_SHORTENING: { name: 'egov-url-shortening', port: 8106, namespace: 'egov' },
    EGOV_USER: { name: 'egov-user', port: 8107, namespace: 'egov' },
    EGOV_USER_EVENT: { name: 'egov-user-event', port: 8108, namespace: 'egov' },
    EGOV_WORKFLOW_V2: { name: 'egov-workflow-v2', port: 8109, namespace: 'egov' },
    GATEWAY: { name: 'gateway', port: 8110, namespace: 'egov' },
    HEALTH_INDIVIDUAL: { name: 'health-individual', port: 8111, namespace: 'egov' },
    HEALTH_SERVICE_REQUEST: { name: 'health-service-request', port: 8112, namespace: 'egov' },
    INBOX: { name: 'inbox', port: 8113, namespace: 'egov' },
    LAND_SERVICES: { name: 'land-services', port: 8114, namespace: 'egov' },
    MDMS_V2: { name: 'mdms-v2', port: 8115, namespace: 'egov' },
    NOC_SERVICES: { name: 'noc-services', port: 8116, namespace: 'egov' },
    PDF_SERVICE: { name: 'pdf-service', port: 8117, namespace: 'egov' },
    PGR_SERVICES: { name: 'pgr-services', port: 8118, namespace: 'egov' },
    PROPERTY_SERVICES: { name: 'property-services', port: 8119, namespace: 'egov' },
    PUBLIC_SERVICE: { name: 'public-service', port: 8120, namespace: 'egov' },
    RAINMAKER_PGR: { name: 'rainmaker-pgr', port: 8121, namespace: 'egov' },
    REPORT: { name: 'report', port: 8122, namespace: 'egov' },
    STUDIO_PDF: { name: 'studio-pdf', port: 8123, namespace: 'egov' },
    TL_CALCULATOR: { name: 'tl-calculator', port: 8124, namespace: 'egov' },
    TL_SERVICES: { name: 'tl-services', port: 8125, namespace: 'egov' },
    USER_OTP: { name: 'user-otp', port: 8126, namespace: 'egov' },

    // DIGIT specific services
    DIGIT_STUDIO: { name: 'digit-studio', port: 3001, namespace: 'egov' },
    DIGIT_UI: { name: 'digit-ui', port: 3002, namespace: 'egov' },
    DJIBOUTI_MDMS: { name: 'djibouti-mdms', port: 8127, namespace: 'egov' },

    // UI services
    CITIZEN: { name: 'citizen', port: 3003, namespace: 'egov' },
    EMPLOYEE: { name: 'employee', port: 3004, namespace: 'egov' },

    // Database services
    POSTGRES: { name: 'postgres-postgresql-0', port: 5432, namespace: 'backbone' },

    // Monitoring services
    CERT_MANAGER: { name: 'cert-manager', port: 9402, namespace: 'egov' },
    CERT_MANAGER_WEBHOOK: { name: 'cert-manager-webhook', port: 10250, namespace: 'egov' },
    CERT_MANAGER_CAINJECTOR: { name: 'cert-manager-cainjector', port: 9403, namespace: 'egov' }
};

// Intent definitions for allowed operations
const IntentType = {
    RESTART_EGOV_ACCESSCONTROL: 'restart_egov_accesscontrol',
    EXECUTE_POSTGRES_COMMAND: 'execute_postgres_command',
    GET_SERVICE_STATUS: 'get_service_status',
    GET_SERVICE_LOGS: 'get_service_logs',
    SETUP_SERVICE_PORT_FORWARD: 'setup_service_port_forward'
};

class KubernetesManager {
    constructor() {
        this.kc = new k8s.KubeConfig();
        this.appsV1Api = null;
        this.coreV1Api = null;
        this.networkingV1Api = null;
        this.initialized = false;
        this.defaultNamespace = process.env.K8S_NAMESPACE || 'egov';

        this.init();
    }

    init() {
        try {
            // Load from local kubeconfig
            if (process.env.KUBECONFIG) {
                console.log('Loading kubeconfig from:', process.env.KUBECONFIG);
                this.kc.loadFromFile(process.env.KUBECONFIG);
            } else {
                // Load from default kubectl location
                this.kc.loadFromDefault();
            }

            // Create API clients with correct class names
            this.appsV1Api = this.kc.makeApiClient(k8s.AppsV1Api);
            this.coreV1Api = this.kc.makeApiClient(k8s.CoreV1Api);
            this.networkingV1Api = this.kc.makeApiClient(k8s.NetworkingV1Api);

            this.initialized = true;
            console.log('✅ Kubernetes client initialized successfully');
        } catch (error) {
            console.warn('⚠️  Kubernetes client initialization failed:', error.message);
            console.warn('   This may be due to missing kubeconfig or cluster access');
            this.initialized = false;
        }
    }

    // Health check for k8s connection
    async healthCheck() {
        if (!this.initialized) {
            return { status: 'error', message: 'Kubernetes client not initialized' };
        }

        try {
            // Use CoreV1Api to check connection by listing namespaces
            const response = await this.coreV1Api.listNamespace();
            return {
                status: 'healthy',
                message: 'Connected to Kubernetes API',
                namespaceCount: response.body.items.length,
                kubeconfig: process.env.KUBECONFIG ? 'custom' : 'egov'
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Failed to connect to Kubernetes API: ${error.message}`
            };
        }
    }

    // Intent-based API: Restart egov-accesscontrol service
    async executeIntent_RestartEgovAccesscontrol() {
        if (!this.initialized) {
            throw new Error('Kubernetes client not initialized');
        }

        const serviceConfig = ServiceConfig.EGOV_ACCESSCONTROL;

        try {
            // Find the deployment name by looking for pods
            const pods = await this.coreV1Api.listNamespacedPod({ namespace: serviceConfig.namespace });

            const matchingPod = pods.items.find(pod =>
                pod.metadata.name.includes(serviceConfig.name)
            );

            // console.log('Matching pod:', matchingPod);

            if (!matchingPod) {
                throw new Error(`No pod found for service: ${serviceConfig.name}`);
            }

            // Use the service name as deployment name (they should match)
            const deploymentName = serviceConfig.name;

            // Restart the deployment by adding a restart annotation
            const patch = [
                {
                    op: 'replace',
                    path: '/spec/template/metadata/annotations',
                    value: {
                        'kubectl.kubernetes.io/restartedAt': new Date().toISOString()
                    },
                },
            ];

            console.log('Patch:', JSON.stringify(patch));
            console.log('Pod details:', matchingPod);
            console.log('Deployment name:', deploymentName);

            const response = await this.appsV1Api.patchNamespacedDeployment({
                name: deploymentName,
                namespace: serviceConfig.namespace,
                body: patch,
                headers: { 'content-type': k8s.PatchStrategy.StrategicMergePatch }
            });

            console.log('Response after restart:', response);

            return {
                intent: IntentType.RESTART_EGOV_ACCESSCONTROL,
                service: serviceConfig.name,
                namespace: serviceConfig.namespace,
                deploymentName,
                restarted: true,
                restartedAt: new Date().toISOString(),
                currentReplicas: response.status.replicas || 0,
                message: `Successfully restarted ${serviceConfig.name}`
            };
        } catch (error) {
            throw new Error(`Failed to restart ${serviceConfig.name}: ${error.message}`);
        }
    }

    // Intent-based API: Execute command on specific postgres service
    async executeIntent_PostgresCommand(sqlCommand) {
        if (!this.initialized) {
            throw new Error('Kubernetes client not initialized');
        }

        const serviceConfig = ServiceConfig.POSTGRES;

        try {
            // Validate the command is a SELECT query for safety
            const trimmedCommand = sqlCommand.trim().toLowerCase();
            if (!trimmedCommand.startsWith('select') && !trimmedCommand.startsWith('show') && !trimmedCommand.startsWith('explain')) {
                throw new Error('Only SELECT, SHOW, and EXPLAIN queries are allowed for security');
            }

            // Execute the command inside the postgres pod
            const command = [
                'psql',
                '-U', process.env.DB_USER || 'postgres',
                '-d', process.env.DB_NAME || 'djibouti_egov',
                '-c', sqlCommand
            ];

            return new Promise((resolve, reject) => {
                const kubectlCmd = [
                    'kubectl', 'exec', '-n', serviceConfig.namespace,
                    serviceConfig.name, '--',
                    ...command
                ];

                exec(kubectlCmd.join(' '), {
                    timeout: parseInt(process.env.QUERY_TIMEOUT) || 30000,
                    maxBuffer: parseInt(process.env.MAX_BUFFER_SIZE) || 1024 * 1024
                }, (error, stdout, stderr) => {
                    if (error) {
                        reject(new Error(`Command execution failed: ${error.message}\nStderr: ${stderr}`));
                    } else {
                        resolve({
                            intent: IntentType.EXECUTE_POSTGRES_COMMAND,
                            service: serviceConfig.name,
                            namespace: serviceConfig.namespace,
                            command: sqlCommand,
                            output: stdout.trim(),
                            stderr: stderr.trim(),
                            success: true,
                            executedAt: new Date().toISOString()
                        });
                    }
                });
            });
        } catch (error) {
            throw new Error(`Failed to execute postgres command: ${error.message}`);
        }
    }

    // Intent-based API: Get service status
    async executeIntent_GetServiceStatus(serviceKey) {
        if (!this.initialized) {
            throw new Error('Kubernetes client not initialized');
        }

        const serviceConfig = ServiceConfig[serviceKey];
        if (!serviceConfig) {
            throw new Error(`Unknown service: ${serviceKey}`);
        }

        try {
            const pods = await this.coreV1Api.listNamespacedPod(serviceConfig.namespace);
            const matchingPod = pods.body.items.find(pod =>
                pod.metadata.name.includes(serviceConfig.name)
            );

            if (!matchingPod) {
                return {
                    intent: IntentType.GET_SERVICE_STATUS,
                    service: serviceConfig.name,
                    namespace: serviceConfig.namespace,
                    status: 'not_found',
                    message: 'No pod found for this service'
                };
            }

            return {
                intent: IntentType.GET_SERVICE_STATUS,
                service: serviceConfig.name,
                namespace: serviceConfig.namespace,
                podName: matchingPod.metadata.name,
                status: matchingPod.status.phase,
                ready: matchingPod.status.containerStatuses?.every(c => c.ready) || false,
                restarts: matchingPod.status.containerStatuses?.reduce((sum, c) => sum + c.restartCount, 0) || 0,
                created: matchingPod.metadata.creationTimestamp,
                assignedPort: serviceConfig.port,
                healthCheckUrl: `http://localhost:${serviceConfig.port}/health`
            };
        } catch (error) {
            throw new Error(`Failed to get service status: ${error.message}`);
        }
    }

    // Intent-based API: Get service logs
    async executeIntent_GetServiceLogs(serviceKey, options = {}) {
        if (!this.initialized) {
            throw new Error('Kubernetes client not initialized');
        }

        const serviceConfig = ServiceConfig[serviceKey];
        if (!serviceConfig) {
            throw new Error(`Unknown service: ${serviceKey}`);
        }

        try {
            const pods = await this.coreV1Api.listNamespacedPod(serviceConfig.namespace);
            const matchingPod = pods.body.items.find(pod =>
                pod.metadata.name.includes(serviceConfig.name)
            );

            if (!matchingPod) {
                throw new Error(`No pod found for service: ${serviceConfig.name}`);
            }

            const logOptions = {
                follow: false,
                tailLines: options.tailLines || 100,
                timestamps: options.timestamps !== false,
            };

            const response = await this.coreV1Api.readNamespacedPodLog(
                matchingPod.metadata.name,
                serviceConfig.namespace,
                undefined,
                logOptions.follow,
                undefined,
                undefined,
                undefined,
                undefined,
                logOptions.tailLines,
                logOptions.timestamps
            );

            return {
                intent: IntentType.GET_SERVICE_LOGS,
                service: serviceConfig.name,
                namespace: serviceConfig.namespace,
                podName: matchingPod.metadata.name,
                logs: response.body,
                options: logOptions,
                retrievedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Failed to get service logs: ${error.message}`);
        }
    }

    // Intent-based API: Setup port forwarding for a service
    async executeIntent_SetupServicePortForward(serviceKey) {
        const serviceConfig = ServiceConfig[serviceKey];
        if (!serviceConfig) {
            throw new Error(`Unknown service: ${serviceKey}`);
        }

        try {
            const pods = await this.coreV1Api.listNamespacedPod(serviceConfig.namespace);
            const matchingPod = pods.body.items.find(pod =>
                pod.metadata.name.includes(serviceConfig.name)
            );

            if (!matchingPod) {
                throw new Error(`No pod found for service: ${serviceConfig.name}`);
            }

            // For postgres, use internal port 5432, for others use 8080
            const targetPort = serviceConfig.name.includes('postgres') ? 5432 : 8080;

            const command = `kubectl port-forward -n ${serviceConfig.namespace} ${matchingPod.metadata.name} ${serviceConfig.port}:${targetPort}`;

            return {
                intent: IntentType.SETUP_SERVICE_PORT_FORWARD,
                service: serviceConfig.name,
                namespace: serviceConfig.namespace,
                podName: matchingPod.metadata.name,
                localPort: serviceConfig.port,
                remotePort: targetPort,
                command,
                url: `http://localhost:${serviceConfig.port}`,
                message: `Port forward setup for ${serviceConfig.name}`,
                instructions: `Execute this command in your terminal: ${command}`
            };
        } catch (error) {
            throw new Error(`Failed to setup port forward: ${error.message}`);
        }
    }

    // Get all available services
    getAvailableServices() {
        return Object.keys(ServiceConfig).map(key => ({
            key,
            ...ServiceConfig[key]
        }));
    }

    // Get available intents
    getAvailableIntents() {
        return Object.values(IntentType);
    }
}

// Export the class and a singleton instance
const k8sManager = new KubernetesManager();

module.exports = {
    KubernetesManager,
    k8sManager,
    ServiceConfig,
    IntentType
}; 