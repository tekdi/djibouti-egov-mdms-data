import { apiClient } from './apiClient';
import { defaultRoleToolMappingData } from '@/data/roleToolMapping';

export interface Role {
  code: string;
  name: string;
  description?: string;
}

export interface RoleMappingData {
  mappings: Array<{
    role: string;
    tools: string[];
  }>;
  tools: Array<{
    id: string;
    name: string;
    path: string;
    description: string;
  }>;
}

/**
 * Fetch all roles from the MDMS API
 */
export async function fetchAllRoles(): Promise<Role[]> {
  try {
    const response = await apiClient.authenticated(
      '/egov-mdms-service/v1/_search',
      {
        MdmsCriteria: {
          tenantId: 'dj',
          moduleDetails: [
            {
              moduleName: 'ACCESSCONTROL-ROLES',
              masterDetails: [
                {
                  name: 'roles'
                }
              ]
            }
          ]
        }
      }
    );

    const roles = response.data?.MdmsRes?.['ACCESSCONTROL-ROLES']?.roles || [];
    return roles.map((role: any) => ({
      code: role.code,
      name: role.name,
      description: role.description
    }));
  } catch (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
}

/**
 * Save role-tool mapping configuration to the backend
 */
export async function saveRoleToolMapping(data: RoleMappingData): Promise<void> {
  try {
    await apiClient.post('/api-local/role-tool-mapping', data);
  } catch (error) {
    console.error('Error saving role-tool mapping:', error);
    throw error;
  }
}

/**
 * Load role-tool mapping configuration from the backend
 */
export async function loadRoleToolMapping(): Promise<RoleMappingData> {
  try {
    const response = await apiClient.get('/api-local/role-tool-mapping');
    return response.data;
  } catch (error) {
    console.error('Error loading role-tool mapping:', error);
    // Return default data if loading fails
    return defaultRoleToolMappingData as RoleMappingData;
  }
}