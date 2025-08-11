/**
 * API client for Public Service Applications
 * Uses the whitelisted proxy for secure access to public-service APIs
 */

import { apiClient } from "./apiClient";

// Base URL for local public service proxy
const LOCAL_PROXY_BASE = "http://localhost:8001/public-service-proxy";

// Application types based on the response structure
export interface ApplicationResponse {
  responseInfo: {
    apiId: string;
    ver: string;
    ts: number;
    resMsgId: string;
    msgId: string;
    status: string;
    UserInfo: {
      uuid: string;
      userName: string;
      name: string;
      mobileNumber: string;
      emailId: string;
      locale: string | null;
      type: string;
      roles: any[] | null;
      active: boolean;
      tenantId: string;
      permanentCity: string | null;
    };
  };
  Application: Application[];
}

export interface Application {
  id: string;
  tenantId: string;
  module: string;
  businessService: string;
  status: string;
  channel: string;
  applicationNumber: string;
  reference: string | null;
  workflowStatus: string;
  serviceCode: string;
  serviceDetails: {
    applicantsCommitment: ApplicantCommitment[];
    buildingDensity: BuildingDensity[];
    identity: Identity[];
  };
  applicants: any[] | null;
  additionalDetails: {
    [key: string]: any;
  };
  address: Address;
  workflow: Workflow;
  auditDetails: AuditDetails;
  processInstance: ProcessInstance[];
  documents: any[] | null;
}

export interface ApplicantCommitment {
  accuracyDeclaration: boolean;
  eligibilityDeclaration: boolean;
  taxCalculationAgreement: string;
}

export interface BuildingDensity {
  constructionCostPerSqM: string;
  coveredProjectArea: string;
  maximumAuthorizedCes: string;
  maximumAuthorizedCos: string;
  prjectedCes: string;
  projectedCos: string;
}

export interface Identity {
  Telephone: string;
  address: string;
  applicantType: string;
  area: string;
  companyName: string;
  companyType: string;
  email: string;
  firstName: string;
  lastName: string;
  legalStatus: string;
  name: string;
  numberOfUnits: string;
  other: string;
  others: string;
  registration: string;
  registrationCertificate: string;
  registrationNumber: string;
  representative: string;
  siteLocation: string;
  telephone: string;
  tfNo: string;
  titreFoncierDefinitif: string;
  typeOfWork: string;
}

export interface Address {
  id: string;
  tenantId: string;
  latitude: number;
  longitude: number;
  addressNumber: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  pincode: string;
  detail: string;
  hierarchyType: string;
  boundarylevel: string;
  boundarycode: string;
}

export interface Workflow {
  id: string;
  action: string;
  businessService: string;
  comment: string;
  assignees: any[];
  documents: any[] | null;
  triggerSelectiveParallelWorkflows: string;
}

export interface AuditDetails {
  createdBy: string;
  lastModifiedBy: string;
  createdTime: number;
  lastModifiedTime: number;
}

export interface ProcessInstance {
  id: string;
  tenantId: string;
  businessService: string;
  businessId: string;
  action: string;
  moduleName: string;
  state: WorkflowState;
  assigner: UserInfo;
  businesssServiceSla: number;
  auditDetails: AuditDetails;
}

export interface WorkflowState {
  uuid: string;
  tenantId: string;
  businessServiceId: string;
  state: string;
  applicationStatus: string;
  actions: WorkflowAction[];
  auditDetails: AuditDetails;
}

export interface WorkflowAction {
  uuid: string;
  tenantId: string;
  currentState: string;
  action: string;
  nextState: string;
  roles: string[];
  auditDetails: AuditDetails;
}

export interface UserInfo {
  uuid: string;
  userName: string;
  name: string;
  mobileNumber: string;
  emailId: string;
  locale: string | null;
  type: string;
  roles: Role[];
  active: boolean;
  tenantId: string;
  permanentCity: string | null;
}

export interface Role {
  name: string;
  code: string;
  tenantId: string;
}

/**
 * Fetch all applications from public service
 */
export async function fetchApplications(
  tenantId: string = "dj"
): Promise<ApplicationResponse> {
  try {
    console.log("📋 Fetching applications for tenant:", tenantId);

    const response = await apiClient.get<ApplicationResponse>(
      `${LOCAL_PROXY_BASE}/public-service/v1/application`,
      {
        headers: {
          "X-Tenant-Id": tenantId,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📋 Applications fetched successfully:", {
      count: response.data.Application?.length || 0,
      tenantId,
    });

    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch applications:", error);
    throw error;
  }
}

/**
 * Get whitelist information for public service proxy
 */
export async function getPublicServiceWhitelist() {
  try {
    const response = await apiClient.get(
      "http://localhost:8001/api-local/public-service/whitelist"
    );
    return response.data;
  } catch (error) {
    console.error("❌ Failed to fetch public service whitelist:", error);
    throw error;
  }
}

/**
 * Setup port forwarding for public service
 */
export async function setupPublicServicePortForward() {
  try {
    const response = await apiClient.post(
      "http://localhost:8001/api-local/intent/port-forward/PUBLIC_SERVICE"
    );
    return response.data;
  } catch (error) {
    console.error("❌ Failed to setup public service port forward:", error);
    throw error;
  }
}
