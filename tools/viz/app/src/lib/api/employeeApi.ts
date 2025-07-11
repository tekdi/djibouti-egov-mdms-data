import { useCallback, useMemo } from "react";
import { useApiClient } from "./useApiClient";
import type {
  Employee,
  EmployeeSearchResponse,
  EmployeeSearchRequest,
  ProcessedEmployee,
  RoleWithEmployeeCount,
  EmployeeRole,
  CreateEmployee,
  CreateEmployeeRequest,
  CreateEmployeeResponse,
} from "@/types/employee";
import type { Role } from "@/types/roleAction";
import type { User } from "@/lib/auth/auth";

// API configuration
const DEFAULT_TENANT_ID = "dj";
const EMPLOYEE_API_BASE = "/egov-hrms/employees/_search";

/**
 * Convert auth User type to employee API userInfo type
 */
function convertUserToEmployeeUserInfo(
  user: User
): EmployeeSearchRequest["RequestInfo"]["userInfo"] {
  return {
    id: parseInt(user.id) || 0, // Convert string to number
    uuid: user.id, // Use id as uuid since uuid isn't available in auth
    userName: user.userName,
    name: user.name,
    mobileNumber: user.mobileNumber,
    emailId: user.emailId,
    locale: "en_IN", // Default locale
    type: "EMPLOYEE", // Default type
    roles: user.roles.map(
      (role): EmployeeRole => ({
        name: role.name,
        code: role.code,
        description: role.name, // Use name as description fallback
        tenantId: DEFAULT_TENANT_ID,
      })
    ),
    active: true, // Assume active if logged in
    tenantId: DEFAULT_TENANT_ID,
    permanentCity: undefined, // Optional field
  };
}

class EmployeeApiService {
  private tenantId: string;

  constructor(tenantId: string = DEFAULT_TENANT_ID) {
    this.tenantId = tenantId;
  }

  /**
   * Make an authenticated API call to the DIGIT backend
   */
  private async makeApiCall(
    endpoint: string,
    data: Record<string, unknown>
  ): Promise<unknown> {
    try {
      const response = await fetch(`/api${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
      console.error("Employee API call error:", error);
      throw error;
    }
  }

  /**
   * Search employees by roles
   */
  async searchEmployeesByRoles(
    roles: string[],
    authToken: string,
    user: User
  ): Promise<Employee[]> {
    if (!roles.length) {
      return [];
    }

    const endpoint = `${EMPLOYEE_API_BASE}?tenantId=${
      this.tenantId
    }&roles=${roles.join(",")}`;

    const requestBody = {
      RequestInfo: {
        apiId: "asset-services",
        ver: undefined,
        ts: undefined,
        action: undefined,
        did: undefined,
        key: undefined,
        msgId: "search with from and to values",
        authToken,
        correlationId: undefined,
        userInfo: convertUserToEmployeeUserInfo(user),
      },
    } as const;

    const response = (await this.makeApiCall(
      endpoint,
      requestBody
    )) as EmployeeSearchResponse;
    return response.Employees || [];
  }

  /**
   * Search all employees (no role filter)
   */
  async searchAllEmployees(authToken: string, user: User): Promise<Employee[]> {
    const endpoint = `${EMPLOYEE_API_BASE}?tenantId=${this.tenantId}`;

    const requestBody = {
      RequestInfo: {
        apiId: "asset-services",
        ver: undefined,
        ts: undefined,
        action: undefined,
        did: undefined,
        key: undefined,
        msgId: "search all employees",
        authToken,
        correlationId: undefined,
        userInfo: convertUserToEmployeeUserInfo(user),
      },
    } as const;

    const response = (await this.makeApiCall(
      endpoint,
      requestBody
    )) as EmployeeSearchResponse;
    return response.Employees || [];
  }

  /**
   * Get employee counts by role
   */
  async getEmployeeCountsByRole(
    authToken: string,
    user: User,
    roles: Role[]
  ): Promise<Map<string, number>> {
    const roleCounts = new Map<string, number>();

    // Initialize all roles with 0 count
    roles.forEach((role) => {
      roleCounts.set(role.code, 0);
    });

    try {
      // Get all employees
      const allEmployees = await this.searchAllEmployees(authToken, user);

      // Count employees by role
      allEmployees.forEach((employee) => {
        employee.user.roles.forEach((role) => {
          const currentCount = roleCounts.get(role.code) || 0;
          roleCounts.set(role.code, currentCount + 1);
        });
      });
    } catch (error) {
      console.error("Error getting employee counts by role:", error);
    }

    return roleCounts;
  }

  /**
   * Create a new employee
   */
  async createEmployee(
    employeeData: CreateEmployee,
    authToken: string,
    user: User
  ): Promise<Employee[]> {
    const endpoint = "/egov-hrms/employees/_create";

    const requestBody: CreateEmployeeRequest = {
      RequestInfo: {
        apiId: "asset-services",
        ver: undefined,
        ts: undefined,
        action: undefined,
        did: undefined,
        key: undefined,
        msgId: "create employee",
        authToken,
        correlationId: undefined,
        userInfo: convertUserToEmployeeUserInfo(user),
      },
      Employees: [employeeData],
    };

    const response = (await this.makeApiCall(
      endpoint,
      requestBody as unknown as Record<string, unknown>
    )) as CreateEmployeeResponse;
    return response.Employees || [];
  }

  /**
   * Process raw employee data for display
   */
  processEmployeeData(employees: Employee[]): ProcessedEmployee[] {
    return employees.map((employee) => ({
      id: employee.id,
      uuid: employee.uuid,
      name: employee.user.name,
      userName: employee.user.userName,
      emailId: employee.user.emailId,
      mobileNumber: employee.user.mobileNumber,
      employeeStatus: employee.employeeStatus,
      employeeType: employee.employeeType,
      roles: employee.user.roles.map((role) => role.name).join(", "),
      department:
        employee.assignments.find((a) => a.isCurrentAssignment)?.department ||
        "N/A",
      designation:
        employee.assignments.find((a) => a.isCurrentAssignment)?.designation ||
        "N/A",
      tenantId: employee.tenantId,
      isActive: employee.isActive,
    }));
  }
}

/**
 * React hook for using the Employee API
 */
export function useEmployeeApi() {
  const { token, user, isAuthenticated } = useApiClient();

  const apiService = useMemo(() => new EmployeeApiService(), []);

  const searchEmployeesByRoles = useCallback(
    async (roles: string[]): Promise<ProcessedEmployee[]> => {
      if (!isAuthenticated || !token || !user) {
        throw new Error("Authentication required");
      }

      const employees = await apiService.searchEmployeesByRoles(
        roles,
        token,
        user
      );
      return apiService.processEmployeeData(employees);
    },
    [apiService, isAuthenticated, token, user]
  );

  const searchAllEmployees = useCallback(async (): Promise<
    ProcessedEmployee[]
  > => {
    if (!isAuthenticated || !token || !user) {
      throw new Error("Authentication required");
    }

    const employees = await apiService.searchAllEmployees(token, user);
    return apiService.processEmployeeData(employees);
  }, [apiService, isAuthenticated, token, user]);

  const getEmployeeCountsByRole = useCallback(
    async (roles: Role[]): Promise<Map<string, number>> => {
      if (!isAuthenticated || !token || !user) {
        throw new Error("Authentication required");
      }

      return apiService.getEmployeeCountsByRole(token, user, roles);
    },
    [apiService, isAuthenticated, token, user]
  );

  const enhanceRolesWithEmployeeCounts = useCallback(
    async (roles: Role[]): Promise<RoleWithEmployeeCount[]> => {
      if (!isAuthenticated || !token || !user) {
        throw new Error("Authentication required");
      }

      const counts = await getEmployeeCountsByRole(roles);

      return roles.map((role) => ({
        ...role,
        employeeCount: counts.get(role.code) || 0,
      }));
    },
    [getEmployeeCountsByRole, isAuthenticated, token, user]
  );

  const createEmployee = useCallback(
    async (employeeData: CreateEmployee): Promise<Employee[]> => {
      if (!isAuthenticated || !token || !user) {
        throw new Error("Authentication required");
      }

      return apiService.createEmployee(employeeData, token, user);
    },
    [apiService, isAuthenticated, token, user]
  );

  return {
    searchEmployeesByRoles,
    searchAllEmployees,
    getEmployeeCountsByRole,
    enhanceRolesWithEmployeeCounts,
    createEmployee,
    isAuthenticated,
  };
}
