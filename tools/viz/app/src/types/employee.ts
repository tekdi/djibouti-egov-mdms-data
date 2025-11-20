export interface EmployeeRole {
  name: string;
  code: string;
  description?: string;
  tenantId: string;
}

export interface EmployeeUser {
  id: number;
  uuid: string;
  userName: string;
  name: string;
  gender?: string;
  mobileNumber: string;
  emailId: string;
  active: boolean;
  dob?: number;
  pwdExpiryDate?: number;
  locale?: string;
  type: string;
  roles: EmployeeRole[];
  tenantId: string;
  permanentAddress?: string;
  permanentCity?: string;
  permanentPinCode?: string;
  correspondenceCity?: string;
  correspondencePinCode?: string;
  correspondenceAddress?: string;
  fatherOrHusbandName?: string;
  relationship?: string;
  bloodGroup?: string;
  identificationMark?: string;
  photo?: string;
  createdBy: string;
  createdDate: number;
  lastModifiedBy: string;
  lastModifiedDate: number;
  accountLocked: boolean;
}

export interface EmployeeJurisdiction {
  id: string;
  hierarchy: string;
  boundary: string;
  boundaryType: string;
  tenantId: string;
  isActive: boolean;
  auditDetails: {
    createdBy: string;
    createdDate: number;
    lastModifiedBy?: string;
    lastModifiedDate: number;
  };
}

export interface EmployeeAssignment {
  id: string;
  position: number;
  designation: string;
  department: string;
  fromDate: number;
  toDate?: number;
  govtOrderNumber?: string;
  tenantid: string;
  reportingTo?: string;
  isHOD: boolean;
  isCurrentAssignment: boolean;
  auditDetails: {
    createdBy: string;
    createdDate: number;
    lastModifiedBy?: string;
    lastModifiedDate: number;
  };
}

export interface Employee {
  id: number;
  uuid: string;
  code: string;
  employeeStatus: string;
  employeeType: string;
  dateOfAppointment?: number;
  jurisdictions: EmployeeJurisdiction[];
  assignments: EmployeeAssignment[];
  serviceHistory: any[];
  education: any[];
  tests: any[];
  tenantId: string;
  documents: any[];
  deactivationDetails: any[];
  reactivationDetails: any[];
  reActivateEmployee: boolean;
  user: EmployeeUser;
  isActive: boolean;
  auditDetails: {
    createdBy: string;
    createdDate: number;
    lastModifiedBy?: string;
    lastModifiedDate: number;
  };
}

export interface EmployeeSearchResponse {
  ResponseInfo: {
    apiId: string;
    ver?: string;
    ts?: string;
    resMsgId: string;
    msgId: string;
    status: string;
  };
  Employees: Employee[];
}

export interface EmployeeSearchRequest {
  RequestInfo: {
    apiId: string;
    ver?: string;
    ts?: string;
    action?: string;
    did?: string;
    key?: string;
    msgId: string;
    authToken: string;
    correlationId?: string;
    userInfo: {
      id: number;
      uuid: string;
      userName: string;
      name: string;
      mobileNumber: string;
      emailId: string;
      locale?: string;
      type: string;
      roles: EmployeeRole[];
      active: boolean;
      tenantId: string;
      permanentCity?: string;
    };
  };
}

// Processed data for display
export interface ProcessedEmployee {
  id: number;
  uuid: string;
  name: string;
  userName: string;
  emailId: string;
  mobileNumber: string;
  employeeStatus: string;
  employeeType: string;
  roles: string;
  department: string;
  designation: string;
  tenantId: string;
  isActive: boolean;
}

// Role with employee count
export interface RoleWithEmployeeCount {
  code: string;
  name: string;
  description?: string;
  employeeCount: number;
}

// Types for employee creation
export interface CreateEmployeeUser {
  tenantId: string;
  userName: string;
  emailId: string;
  password: string;
  name: string;
  mobileNumber: string;
  dob?: number;
  roles: EmployeeRole[];
  active: boolean;
  type: string;
  permanentAddress?: string;
  permanentCity?: string;
  permanentPinCode?: string;
  correspondenceAddress?: string;
  correspondenceCity?: string;
  correspondencePinCode?: string;
}

export interface CreateEmployeeAssignment {
  designation: string;
  department: string;
  fromDate: string;
  isCurrentAssignment: boolean;
}

export interface CreateEmployeeJurisdiction {
  hierarchy: string;
  boundary: string;
  boundaryType: string;
  active: boolean;
}

export interface CreateEmployee {
  tenantId: string;
  code: string;
  name: string;
  employeeStatus: string;
  employeeType: string;
  user: CreateEmployeeUser;
  assignments: CreateEmployeeAssignment[];
  jurisdictions: CreateEmployeeJurisdiction[];
}

export interface CreateEmployeeRequest {
  RequestInfo: {
    apiId: string;
    ver?: string;
    ts?: string;
    action?: string;
    did?: string;
    key?: string;
    msgId: string;
    authToken: string;
    correlationId?: string;
    userInfo: {
      id: number;
      uuid: string;
      userName: string;
      name: string;
      mobileNumber: string;
      emailId: string;
      locale?: string;
      type: string;
      roles: EmployeeRole[];
      active: boolean;
      tenantId: string;
      permanentCity?: string;
    };
  };
  Employees: CreateEmployee[];
}

export interface CreateEmployeeResponse {
  ResponseInfo: {
    apiId: string;
    ver?: string;
    ts?: string;
    resMsgId: string;
    msgId: string;
    status: string;
  };
  Employees: Employee[];
}
