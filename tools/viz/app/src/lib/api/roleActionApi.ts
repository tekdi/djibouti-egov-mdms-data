// API service for role-action data
import { useCallback } from "react";
import { useApiClient } from "./useApiClient";
import type { Role, Action, RoleAction } from "@/types/roleAction";

export type NewRolePayload = Omit<Role, "description"> & {
  description?: string;
};
export type NewActionPayload = Omit<
  Action,
  "enabled" | "displayName" | "serviceCode"
> & { enabled?: boolean; displayName?: string; serviceCode?: string };
export type NewRoleActionPayload = RoleAction;

// Define response types
interface MdmsResponse<T> {
  mdms?: Array<{ data: T }>;
  MdmsRes?: {
    [key: string]: {
      [key: string]: T[];
    };
  };
}

// API configuration
const DEFAULT_TENANT_ID = "dj"; // Default tenant ID
const API_BASE_URL = "/api"; // This will be handled by Vite proxy

class RoleActionApiService {
  private tenantId: string;

  constructor(tenantId: string = DEFAULT_TENANT_ID) {
    this.tenantId = tenantId;
  }

  /**
   * Make an authenticated API call
   */
  private async makeApiCall(
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<unknown> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Add any auth headers if needed
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(
          `API call failed: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("API call error:", error);
      throw error;
    }
  }

  /**
   * Load roles from API
   */
  async loadRoles(): Promise<Role[]> {
    const response = (await this.makeApiCall("/egov-mdms-service/v2/_search", {
      MdmsCriteria: {
        tenantId: this.tenantId,
        schemaCode: "ACCESSCONTROL-ROLES.roles",
        limit: 1000,
        offset: 0,
      },
    })) as MdmsResponse<Role>;

    return response.mdms?.map((item) => item.data) || [];
  }

  /**
   * Load actions from API
   */
  async loadActions(): Promise<Action[]> {
    const response = (await this.makeApiCall("/egov-mdms-service/v2/_search", {
      MdmsCriteria: {
        tenantId: this.tenantId,
        schemaCode: "ACCESSCONTROL-ACTIONS-TEST.actions-test",
        limit: 5000,
        offset: 0,
      },
    })) as MdmsResponse<Action>;

    return response.mdms?.map((item) => item.data) || [];
  }

  /**
   * Load role-actions from API
   */
  async loadRoleActions(): Promise<RoleAction[]> {
    const response = (await this.makeApiCall("/egov-mdms-service/v2/_search", {
      MdmsCriteria: {
        tenantId: this.tenantId,
        schemaCode: "ACCESSCONTROL-ROLEACTIONS.roleactions",
        limit: 10000,
        offset: 0,
      },
    })) as MdmsResponse<RoleAction>;

    return response.mdms?.map((item) => item.data) || [];
  }

  /**
   * Load all data from API
   */
  async loadApiData(): Promise<{
    roles: Role[];
    actions: Action[];
    roleActions: RoleAction[];
  }> {
    try {
      const [rolesResponse, actionsResponse, roleActionsResponse] =
        await Promise.all([
          this.makeApiCall("/egov-mdms-service/v2/_search", {
            MdmsCriteria: {
              tenantId: this.tenantId,
              schemaCode: "ACCESSCONTROL-ROLES.roles",
              limit: 1000,
              offset: 0,
            },
          }) as Promise<MdmsResponse<Role>>,
          this.makeApiCall("/egov-mdms-service/v2/_search", {
            MdmsCriteria: {
              tenantId: this.tenantId,
              schemaCode: "ACCESSCONTROL-ACTIONS-TEST.actions-test",
              limit: 5000,
              offset: 0,
            },
          }) as Promise<MdmsResponse<Action>>,
          this.makeApiCall("/egov-mdms-service/v2/_search", {
            MdmsCriteria: {
              tenantId: this.tenantId,
              schemaCode: "ACCESSCONTROL-ROLEACTIONS.roleactions",
              limit: 10000,
              offset: 0,
            },
          }) as Promise<MdmsResponse<RoleAction>>,
        ]);

      const getRoles = (res: MdmsResponse<Role>) => {
        if (res.MdmsRes) return res.MdmsRes["ACCESSCONTROL-ROLES"]?.roles || [];
        if (res.mdms) return res.mdms.map((item) => item.data);
        return [];
      };
      const getActions = (res: MdmsResponse<Action>) => {
        if (res.MdmsRes)
          return (
            res.MdmsRes["ACCESSCONTROL-ACTIONS-TEST"]?.["actions-test"] || []
          );
        if (res.mdms) return res.mdms.map((item) => item.data);
        return [];
      };
      const getRoleActions = (res: MdmsResponse<RoleAction>) => {
        if (res.MdmsRes)
          return res.MdmsRes["ACCESSCONTROL-ROLEACTIONS"]?.roleactions || [];
        if (res.mdms) return res.mdms.map((item) => item.data);
        return [];
      };

      return {
        roles: getRoles(rolesResponse),
        actions: getActions(actionsResponse),
        roleActions: getRoleActions(roleActionsResponse),
      };
    } catch (error) {
      throw new Error(
        `Failed to load API data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Load data from local JSON files
   */
  async loadLocalData(): Promise<{
    roles: Role[];
    actions: Action[];
    roleActions: RoleAction[];
  }> {
    try {
      const [roleActionsResponse, actionsResponse, rolesResponse] =
        await Promise.all([
          fetch("/data/dj/ACCESSCONTROL-ROLEACTIONS/roleactions.json"),
          fetch("/data/dj/ACCESSCONTROL-ACTIONS-TEST/actions-test.json"),
          fetch("/data/dj/ACCESSCONTROL-ROLES/roles.json"),
        ]);

      if (!roleActionsResponse.ok || !actionsResponse.ok || !rolesResponse.ok) {
        throw new Error("Failed to load one or more local data files");
      }

      const [roleActionsData, actionsData, rolesData] = await Promise.all([
        roleActionsResponse.json(),
        actionsResponse.json(),
        rolesResponse.json(),
      ]);

      return {
        roleActions: roleActionsData.roleactions || [],
        actions: actionsData["actions-test"] || [],
        roles: rolesData.roles || [],
      };
    } catch (error) {
      throw new Error(
        `Failed to load local data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Create a new role via API
   */
  async createRole(role: Omit<Role, "id">): Promise<void> {
    await this.makeApiCall(
      "/egov-mdms-service/v2/_create/ACCESSCONTROL-ROLES.roles",
      {
        Mdms: {
          tenantId: this.tenantId,
          schemaCode: "ACCESSCONTROL-ROLES.roles",
          data: role,
        },
      }
    );
  }

  /**
   * Create a new action via API
   */
  async createAction(action: Omit<Action, "tenantId">): Promise<void> {
    await this.makeApiCall(
      "/egov-mdms-service/v2/_create/ACCESSCONTROL-ACTIONS-TEST.actions-test",
      {
        Mdms: {
          tenantId: this.tenantId,
          schemaCode: "ACCESSCONTROL-ACTIONS-TEST.actions-test",
          data: {
            ...action,
            tenantId: this.tenantId,
          },
        },
      }
    );
  }

  /**
   * Create a new role-action mapping via API
   */
  async createRoleAction(
    roleAction: Omit<RoleAction, "tenantId">
  ): Promise<void> {
    await this.makeApiCall(
      "/egov-mdms-service/v2/_create/ACCESSCONTROL-ROLEACTIONS.roleactions",
      {
        Mdms: {
          tenantId: this.tenantId,
          schemaCode: "ACCESSCONTROL-ROLEACTIONS.roleactions",
          data: {
            ...roleAction,
            tenantId: this.tenantId,
          },
        },
      }
    );
  }
}

// Export a singleton instance
// Hook-based API functions with authentication using the new API client
export function useRoleActionApi() {
  const apiClient = useApiClient();

  const loadApiData = useCallback(async () => {
    const [rolesResponse, actionsResponse, roleActionsResponse] =
      await Promise.all([
        apiClient.callApi<MdmsResponse<Role>>("/egov-mdms-service/v2/_search", {
          MdmsCriteria: {
            tenantId: DEFAULT_TENANT_ID,
            schemaCode: "ACCESSCONTROL-ROLES.roles",
            limit: 1000,
            offset: 0,
          },
        }),
        apiClient.callApi<MdmsResponse<Action>>(
          "/egov-mdms-service/v2/_search",
          {
            MdmsCriteria: {
              tenantId: DEFAULT_TENANT_ID,
              schemaCode: "ACCESSCONTROL-ACTIONS-TEST.actions-test",
              limit: 5000,
              offset: 0,
            },
          }
        ),
        apiClient.callApi<MdmsResponse<RoleAction>>(
          "/egov-mdms-service/v2/_search",
          {
            MdmsCriteria: {
              tenantId: DEFAULT_TENANT_ID,
              schemaCode: "ACCESSCONTROL-ROLEACTIONS.roleactions",
              limit: 10000,
              offset: 0,
            },
          }
        ),
      ]);

    const getRoles = (res: MdmsResponse<Role>): Role[] => {
      if (res.MdmsRes) return res.MdmsRes["ACCESSCONTROL-ROLES"]?.roles || [];
      if (res.mdms) return res.mdms.map((item) => item.data);
      return [];
    };
    const getActions = (res: MdmsResponse<Action>): Action[] => {
      if (res.MdmsRes)
        return (
          res.MdmsRes["ACCESSCONTROL-ACTIONS-TEST"]?.["actions-test"] || []
        );
      if (res.mdms) return res.mdms.map((item) => item.data);
      return [];
    };
    const getRoleActions = (res: MdmsResponse<RoleAction>): RoleAction[] => {
      if (res.MdmsRes)
        return res.MdmsRes["ACCESSCONTROL-ROLEACTIONS"]?.roleactions || [];
      if (res.mdms) return res.mdms.map((item) => item.data);
      return [];
    };

    return {
      roles: getRoles(rolesResponse),
      actions: getActions(actionsResponse),
      roleActions: getRoleActions(roleActionsResponse),
    };
  }, [apiClient]);

  const createRole = useCallback(
    async (role: NewRolePayload) => {
      return apiClient.callApi(
        "/egov-mdms-service/v2/_create/ACCESSCONTROL-ROLES.roles",
        {
          Mdms: {
            tenantId: DEFAULT_TENANT_ID,
            schemaCode: "ACCESSCONTROL-ROLES.roles",
            data: role,
          },
        }
      );
    },
    [apiClient]
  );

  const createAction = useCallback(
    async (action: NewActionPayload) => {
      return apiClient.callApi(
        "/egov-mdms-service/v2/_create/ACCESSCONTROL-ACTIONS-TEST.actions-test",
        {
          Mdms: {
            tenantId: DEFAULT_TENANT_ID,
            schemaCode: "ACCESSCONTROL-ACTIONS-TEST.actions-test",
            data: { ...action, tenantId: DEFAULT_TENANT_ID },
          },
        }
      );
    },
    [apiClient]
  );

  const createRoleAction = useCallback(
    async (roleAction: NewRoleActionPayload) => {
      return apiClient.callApi(
        "/egov-mdms-service/v2/_create/ACCESSCONTROL-ROLEACTIONS.roleactions",
        {
          Mdms: {
            tenantId: DEFAULT_TENANT_ID,
            schemaCode: "ACCESSCONTROL-ROLEACTIONS.roleactions",
            data: { ...roleAction, tenantId: DEFAULT_TENANT_ID },
          },
        }
      );
    },
    [apiClient]
  );

  return {
    loadApiData,
    createRole,
    createAction,
    createRoleAction,
  };
}

export const roleActionApi = new RoleActionApiService();

// Export the class for custom instances
export { RoleActionApiService };
