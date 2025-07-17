/**
 * Centralized API Client with automatic 401 handling
 * This wrapper ensures all API calls automatically handle authentication failures
 */

interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
}

interface ApiError extends Error {
  status?: number;
  statusText?: string;
  response?: Response;
}

interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
  cache?: RequestCache;
  credentials?: RequestCredentials;
}

/**
 * Global auth callback that will be set by the AuthProvider
 * This allows the API client to trigger logout when 401 occurs
 */
let globalLogoutCallback: (() => void) | null = null;

/**
 * Set the global logout callback that will be called when 401 responses are detected
 */
export function setGlobalLogoutCallback(callback: () => void) {
  globalLogoutCallback = callback;
  console.log("✅ Global logout callback registered");
}

/**
 * Handle 401 responses by triggering logout
 */
function handle401Response(response: Response) {
  console.warn("🚨 401 Unauthorized response detected:", {
    url: response.url,
    status: response.status,
    statusText: response.statusText,
  });

  // Clear any stored tokens immediately
  localStorage.removeItem("egov_token");
  localStorage.removeItem("egov_userInfo");

  // Trigger global logout if callback is available
  if (globalLogoutCallback) {
    console.log("🔄 Triggering global logout callback...");
    // Use setTimeout to avoid blocking the current call stack
    setTimeout(() => {
      globalLogoutCallback!();
    }, 0);
  } else {
    console.error(
      "❌ No global logout callback available. Please ensure AuthProvider is initialized."
    );
    // Fallback: force page reload to login screen
    window.location.reload();
  }
}

/**
 * Get the target URL from localStorage or return default
 */
function getTargetUrl(): string {
  return (
    localStorage.getItem("viz_target_url") || "https://djibouti.tekdinext.com"
  );
}

/**
 * Set the target URL for API proxy requests
 * If user is authenticated, this will logout the user since tokens are environment-specific
 */
export function setTargetUrl(url: string): void {
  const currentUrl = getTargetUrl();
  const isAuthenticated = localStorage.getItem("egov_token");

  // If user is authenticated and trying to change target URL, logout first
  if (isAuthenticated && currentUrl !== url) {
    localStorage.removeItem("egov_token");
    localStorage.removeItem("egov_userInfo");
    // Trigger logout callback if available
    if (globalLogoutCallback) {
      globalLogoutCallback();
    }
  }

  localStorage.setItem("viz_target_url", url);
}

/**
 * Get the current target URL
 */
export function getCurrentTargetUrl(): string {
  return getTargetUrl();
}

/**
 * Reset target URL to default
 */
export function resetTargetUrl(): void {
  localStorage.removeItem("viz_target_url");
}

/**
 * Core request method that handles response and errors
 */
async function request<T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", headers = {}, body, ...fetchConfig } = config;

  const requestHeaders = {
    "Content-Type": "application/json",
    "X-Target-URL": getTargetUrl(), // Add target URL header to all requests
    ...headers,
  };

  const requestConfig: RequestInit = {
    method,
    headers: requestHeaders,
    ...fetchConfig,
  };

  if (body && method !== "GET") {
    requestConfig.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  console.log(`📡 API Request: ${method} ${url}`, {
    headers: requestHeaders,
    hasBody: !!body,
  });

  try {
    const response = await fetch(url, requestConfig);

    console.log(`📡 API Response: ${method} ${url}`, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    // Handle 401 responses immediately
    if (response.status === 401) {
      console.log("🚨 Detected 401 - calling handle401Response...");
      handle401Response(response);

      // Still throw an error so the calling code can handle it
      const error = new Error(
        `Unauthorized access to ${url}: ${response.statusText} - Please log in again`
      ) as ApiError;
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = response;
      throw error;
    }

    // Handle other error responses
    if (!response.ok) {
      let errorMessage = `API call to ${url} failed: ${response.status} ${response.statusText}`;

      try {
        const errorData = await response.text();
        if (errorData) {
          errorMessage += ` - ${errorData}`;
        }
      } catch {
        // Ignore errors when reading error response
      }

      const error = new Error(errorMessage) as ApiError;
      error.status = response.status;
      error.statusText = response.statusText;
      error.response = response;
      throw error;
    }

    // Parse response data
    let data: T;
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    };
  } catch (error) {
    // Re-throw API errors as-is
    if (error instanceof Error && "status" in error) {
      throw error;
    }

    // Handle network errors
    console.error(`❌ Network error for ${method} ${url}:`, error);
    throw new Error(
      `Network error calling ${url}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Convenience methods for different HTTP verbs
 */
export const apiClient = {
  get: <T = any>(
    url: string,
    config?: Omit<RequestConfig, "method" | "body">
  ) => request<T>(url, { ...config, method: "GET" }),

  post: <T = any>(
    url: string,
    body?: any,
    config?: Omit<RequestConfig, "method">
  ) => request<T>(url, { ...config, method: "POST", body }),

  put: <T = any>(
    url: string,
    body?: any,
    config?: Omit<RequestConfig, "method">
  ) => request<T>(url, { ...config, method: "PUT", body }),

  patch: <T = any>(
    url: string,
    body?: any,
    config?: Omit<RequestConfig, "method">
  ) => request<T>(url, { ...config, method: "PATCH", body }),

  delete: <T = any>(
    url: string,
    config?: Omit<RequestConfig, "method" | "body">
  ) => request<T>(url, { ...config, method: "DELETE" }),

  /**
   * Make an authenticated API call with automatic token injection
   * This should be used for calls to the main DIGIT API
   */
  authenticated: <T = any>(
    url: string,
    body?: any,
    config?: Omit<RequestConfig, "method">
  ) => {
    const token = localStorage.getItem("egov_token");
    const userInfoStr = localStorage.getItem("egov_userInfo");

    if (!token || !userInfoStr) {
      throw new Error("Not authenticated. Please login.");
    }

    let userInfo;
    try {
      userInfo = JSON.parse(userInfoStr);
    } catch {
      throw new Error("Invalid user data. Please login again.");
    }

    // Prepare the authenticated request body
    const authenticatedBody = {
      ...(body && typeof body === "object" ? body : {}),
      RequestInfo: {
        apiId: "Rainmaker",
        authToken: token,
        userInfo: userInfo,
      },
    };

    // Add /api prefix for DIGIT API calls
    const fullUrl = url.startsWith("/api") ? url : `/api${url}`;

    return request<T>(fullUrl, {
      ...config,
      method: "POST",
      body: authenticatedBody,
    });
  },

  /**
   * Alias for authenticated method for backward compatibility
   */
  callApi: <T = any>(
    url: string,
    body?: any,
    config?: Omit<RequestConfig, "method">
  ) => apiClient.authenticated<T>(url, body, config),
};

/**
 * Export the core request function for advanced use cases
 */
export { request };

/**
 * Export types for consumers
 */
export type { ApiResponse, ApiError, RequestConfig };
