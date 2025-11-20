/**
 * Custom hook for using the API client with authentication
 * Provides convenient methods for making API calls throughout the application
 */

import { useCallback } from "react";
import { useAuth } from "@/lib/auth/auth";
import { apiClient, type ApiResponse, type RequestConfig } from "./apiClient";

export function useApiClient() {
  const { token, user, isAuthenticated } = useAuth();

  /**
   * Make an authenticated API call to the DIGIT backend
   * Automatically includes RequestInfo with auth token and user info
   */
  const callApi = useCallback(
    async <T = any>(
      endpoint: string,
      data?: any,
      config?: Omit<RequestConfig, "method">
    ): Promise<T> => {
      if (!isAuthenticated) {
        throw new Error("Not authenticated. Please login.");
      }

      const response = await apiClient.authenticated<T>(endpoint, data, config);
      return response.data;
    },
    [isAuthenticated]
  );

  /**
   * Make a GET request (typically for public endpoints)
   */
  const get = useCallback(
    async <T = any>(
      url: string,
      config?: Omit<RequestConfig, "method" | "body">
    ): Promise<T> => {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    },
    []
  );

  /**
   * Make a POST request
   */
  const post = useCallback(
    async <T = any>(
      url: string,
      body?: any,
      config?: Omit<RequestConfig, "method">
    ): Promise<T> => {
      const response = await apiClient.post<T>(url, body, config);
      return response.data;
    },
    []
  );

  /**
   * Make a PUT request
   */
  const put = useCallback(
    async <T = any>(
      url: string,
      body?: any,
      config?: Omit<RequestConfig, "method">
    ): Promise<T> => {
      const response = await apiClient.put<T>(url, body, config);
      return response.data;
    },
    []
  );

  /**
   * Make a DELETE request
   */
  const del = useCallback(
    async <T = any>(
      url: string,
      config?: Omit<RequestConfig, "method" | "body">
    ): Promise<T> => {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    },
    []
  );

  /**
   * Get full response (including headers, status, etc.)
   */
  const getFullResponse = useCallback(
    async <T = any>(
      endpoint: string,
      data?: any,
      config?: Omit<RequestConfig, "method">
    ): Promise<ApiResponse<T>> => {
      if (!isAuthenticated) {
        throw new Error("Not authenticated. Please login.");
      }

      return apiClient.authenticated<T>(endpoint, data, config);
    },
    [isAuthenticated]
  );

  return {
    // Authenticated DIGIT API calls
    callApi,
    getFullResponse,

    // Generic HTTP methods (for external APIs, public endpoints, etc.)
    get,
    post,
    put,
    delete: del,

    // Auth state for conditional logic
    isAuthenticated,
    token,
    user,
  };
}
