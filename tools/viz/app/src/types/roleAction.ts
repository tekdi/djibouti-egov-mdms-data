// Types for Role-Action data structures

export interface Role {
  code: string;
  name: string;
  description?: string;
}

export interface Action {
  id: number;
  url: string;
  name: string;
  displayName?: string;
  serviceCode?: string;
  enabled?: boolean;
  path?: string;
  leftIcon?: string;
  rightIcon?: string;
  orderNumber?: number;
  queryParams?: string;
  parentModule?: string;
  navigationURL?: string;
  tenantId?: string;
}

export interface RoleAction {
  rolecode: string;
  actionid: number;
  actioncode?: string;
  tenantId?: string;
  tenantid?: string; // Alternative naming in some responses
}

// Processed data type for table display
export interface ProcessedRoleActionMapping {
  roleCode: string;
  roleName: string;
  roleDescription: string;
  actionId: number;
  actionName: string;
  actionUrl: string;
  actionDisplayName: string;
  serviceCode: string;
  enabled: boolean;
  tenantId: string;
}

// Data source types
export type DataSource = "api" | "local" | "compare";
export type MainView = "mappings" | "roles" | "actions";

// Data container types
export interface RoleActionData {
  roles: Role[];
  actions: Action[];
  roleActions: RoleAction[];
}
