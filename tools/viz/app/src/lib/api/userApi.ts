import { useCallback } from "react";
import { useApiClient } from "./useApiClient";
import type { User } from "@/lib/auth/auth";

interface UserRole {
  code: string;
  name: string;
  tenantId: string;
}

interface UserUpdateRequest {
  id: number;
  uuid: string;
  name: string;
  userName: string;
  emailId: string;
  mobileNumber: string;
  type: string;
  active: boolean;
  tenantId: string;
  roles: UserRole[];
}

interface UserSearchResponse {
  user: UserUpdateRequest[];
}

const DEFAULT_TENANT_ID = "dj";

/**
 * Search for a user by username
 */
async function searchUser(
  username: string,
  token: string,
  userInfo: User
): Promise<UserUpdateRequest | null> {
  const response = await fetch("/api/user/_search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Target-URL": localStorage.getItem("targetUrl") || "https://djibouti-staging.tekdinext.com",
    },
    body: JSON.stringify({
      RequestInfo: {
        apiId: "asset-services",
        authToken: token,
        userInfo: {
          id: parseInt(userInfo.id) || 0,
          uuid: userInfo.id,
          userName: userInfo.userName,
          name: userInfo.name,
          mobileNumber: userInfo.mobileNumber,
          emailId: userInfo.emailId,
          locale: null,
          type: userInfo.type || "EMPLOYEE",
          roles: userInfo.roles,
          active: true,
          tenantId: DEFAULT_TENANT_ID,
        },
      },
      userName: username,
      tenantId: DEFAULT_TENANT_ID,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to search user: ${response.statusText}`);
  }

  const data: UserSearchResponse = await response.json();
  return data.user?.[0] || null;
}

/**
 * Update a user's roles
 */
async function updateUserRoles(
  user: UserUpdateRequest,
  newRoles: UserRole[],
  token: string,
  userInfo: User
): Promise<UserUpdateRequest> {
  const updatedUser = {
    id: user.id,
    uuid: user.uuid,
    name: user.name,
    userName: user.userName,
    emailId: user.emailId,
    mobileNumber: user.mobileNumber,
    type: user.type,
    active: user.active,
    tenantId: user.tenantId,
    roles: newRoles,
  };

  const response = await fetch("/api/user/users/_updatenovalidate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Target-URL": localStorage.getItem("targetUrl") || "https://djibouti-staging.tekdinext.com",
    },
    body: JSON.stringify({
      RequestInfo: {
        apiId: "asset-services",
        ver: null,
        ts: null,
        action: null,
        did: null,
        key: null,
        msgId: "update user roles",
        authToken: token,
        correlationId: null,
        userInfo: {
          id: userInfo.id.toString(),
          userName: userInfo.userName,
          name: userInfo.name,
          type: userInfo.type,
          mobileNumber: userInfo.mobileNumber,
          emailId: userInfo.emailId,
          roles: userInfo.roles,
          uuid: userInfo.id,
        },
      },
      user: updatedUser,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Failed to update user: ${error.Errors?.[0]?.message || response.statusText}`
    );
  }

  const data = await response.json();
  return data.user?.[0] || data.user || updatedUser;
}

/**
 * Add LOC_ADMIN role to a user if they don't already have it
 */
async function addLocAdminRole(
  username: string,
  token: string,
  userInfo: User
): Promise<boolean> {
  try {
    // Search for the user
    const user = await searchUser(username, token, userInfo);
    if (!user) {
      console.error(`User ${username} not found`);
      return false;
    }

    // Check if user already has LOC_ADMIN role
    const hasLocAdmin = user.roles.some((r) => r.code === "LOC_ADMIN");
    if (hasLocAdmin) {
      console.log(`User ${username} already has LOC_ADMIN role`);
      return true;
    }

    // Add LOC_ADMIN role
    const updatedRoles = [
      ...user.roles,
      {
        code: "LOC_ADMIN",
        name: "Location Admin",
        tenantId: DEFAULT_TENANT_ID,
      },
    ];

    // Update the user
    await updateUserRoles(user, updatedRoles, token, userInfo);
    console.log(`Successfully added LOC_ADMIN role to user ${username}`);
    return true;
  } catch (error) {
    console.error(`Failed to add LOC_ADMIN role to user ${username}:`, error);
    return false;
  }
}

/**
 * Remove LOC_ADMIN role from a user
 */
async function removeLocAdminRole(
  username: string,
  token: string,
  userInfo: User
): Promise<boolean> {
  try {
    // Search for the user
    const user = await searchUser(username, token, userInfo);
    if (!user) {
      console.error(`User ${username} not found`);
      return false;
    }

    // Check if user has LOC_ADMIN role
    const hasLocAdmin = user.roles.some((r) => r.code === "LOC_ADMIN");
    if (!hasLocAdmin) {
      console.log(`User ${username} doesn't have LOC_ADMIN role`);
      return true;
    }

    // Remove LOC_ADMIN role
    const updatedRoles = user.roles.filter((r) => r.code !== "LOC_ADMIN");

    // Update the user
    await updateUserRoles(user, updatedRoles, token, userInfo);
    console.log(`Successfully removed LOC_ADMIN role from user ${username}`);
    return true;
  } catch (error) {
    console.error(`Failed to remove LOC_ADMIN role from user ${username}:`, error);
    return false;
  }
}

/**
 * React hook for user API operations
 */
export function useUserApi() {
  const { token, user: currentUser, isAuthenticated } = useApiClient();

  const updateUserLocalizationAccess = useCallback(
    async (username: string, hasAccess: boolean): Promise<boolean> => {
      if (!isAuthenticated || !token || !currentUser) {
        throw new Error("Authentication required");
      }

      if (hasAccess) {
        return addLocAdminRole(username, token, currentUser);
      } else {
        return removeLocAdminRole(username, token, currentUser);
      }
    },
    [isAuthenticated, token, currentUser]
  );

  const searchUserByUsername = useCallback(
    async (username: string): Promise<UserUpdateRequest | null> => {
      if (!isAuthenticated || !token || !currentUser) {
        throw new Error("Authentication required");
      }

      return searchUser(username, token, currentUser);
    },
    [isAuthenticated, token, currentUser]
  );

  const updateUserRolesApi = useCallback(
    async (user: UserUpdateRequest, newRoles: UserRole[]): Promise<UserUpdateRequest> => {
      if (!isAuthenticated || !token || !currentUser) {
        throw new Error("Authentication required");
      }

      return updateUserRoles(user, newRoles, token, currentUser);
    },
    [isAuthenticated, token, currentUser]
  );

  return {
    updateUserLocalizationAccess,
    searchUserByUsername,
    updateUserRoles: updateUserRolesApi,
    isAuthenticated,
  };
}