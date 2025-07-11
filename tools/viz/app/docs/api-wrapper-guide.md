# API Wrapper Guide

This guide explains how to use the centralized API wrapper that automatically handles 401 (Unauthorized) responses by logging out users and redirecting to the login page.

## Overview

The API wrapper provides:

- ✅ **Automatic 401 handling** - Logs out users when sessions expire
- ✅ **Centralized error handling** - Consistent error formatting across the app
- ✅ **Authentication helpers** - Automatic token injection for DIGIT APIs
- ✅ **TypeScript support** - Full type safety for API responses
- ✅ **Flexible configuration** - Support for different request types

## Quick Start

### 1. Using the Hook (Recommended)

```typescript
import { useApiClient } from "@/lib/api/useApiClient";

function MyComponent() {
  const api = useApiClient();

  const fetchData = async () => {
    try {
      // Authenticated call to DIGIT API (auto-includes RequestInfo)
      const data = await api.callApi("/egov-mdms-service/v2/_search", {
        MdmsCriteria: {
          tenantId: "dj",
          schemaCode: "Studio.ServiceConfiguration",
        },
      });

      console.log("Data received:", data);
    } catch (error) {
      // 401 errors are handled automatically (user logged out)
      console.error("API error:", error.message);
    }
  };

  return <button onClick={fetchData}>Fetch Data</button>;
}
```

### 2. Direct API Client Usage

```typescript
import { apiClient } from "@/lib/api/apiClient";

// For external APIs or non-DIGIT endpoints
const response = await apiClient.get("https://external-api.com/data");

// For authenticated DIGIT APIs
const digitData = await apiClient.authenticated(
  "/egov-mdms-service/v2/_search",
  {
    MdmsCriteria: { tenantId: "dj", schemaCode: "MySchema" },
  }
);
```

## API Methods

### useApiClient Hook Methods

#### `callApi<T>(endpoint, data?, config?)`

Make authenticated calls to DIGIT APIs with automatic RequestInfo injection.

```typescript
const data = await api.callApi<MyResponseType>("/my-service/endpoint", {
  MyParam: "value",
});
```

#### `get<T>(url, config?)`

Make GET requests (typically for public endpoints).

```typescript
const data = await api.get<PublicDataType>("/api/public/data");
```

#### `post<T>(url, body?, config?)`

Make POST requests.

```typescript
const result = await api.post<ResultType>("/api/create", {
  name: "New Item",
});
```

#### `put<T>(url, body?, config?)`

Make PUT requests for updates.

```typescript
const updated = await api.put<UpdatedType>("/api/update/123", {
  name: "Updated Name",
});
```

#### `delete<T>(url, config?)`

Make DELETE requests.

```typescript
await api.delete("/api/delete/123");
```

#### `getFullResponse<T>(endpoint, data?, config?)`

Get the complete response object including headers and status.

```typescript
const response = await api.getFullResponse("/my-endpoint", data);
console.log("Status:", response.status);
console.log("Headers:", response.headers);
console.log("Data:", response.data);
```

### Direct API Client Methods

#### `apiClient.get<T>(url, config?)`

#### `apiClient.post<T>(url, body?, config?)`

#### `apiClient.put<T>(url, body?, config?)`

#### `apiClient.patch<T>(url, body?, config?)`

#### `apiClient.delete<T>(url, config?)`

#### `apiClient.authenticated<T>(url, body?, config?)`

## Error Handling

### Automatic 401 Handling

When any API call receives a 401 response:

1. **Immediate logout** - User auth state is cleared
2. **Token cleanup** - localStorage tokens are removed
3. **Automatic redirect** - AuthProvider shows login page
4. **Error thrown** - Original call receives clear error message

```typescript
try {
  const data = await api.callApi("/protected-endpoint");
} catch (error) {
  // If this was a 401, user is already logged out
  // Handle other errors here
  if (error.status === 401) {
    // This shouldn't happen as 401s are handled automatically
    console.log("User session expired");
  } else {
    console.error("Other error:", error.message);
  }
}
```

### Custom Error Handling

```typescript
try {
  const data = await api.callApi("/my-endpoint");
} catch (error) {
  if (error.status === 404) {
    console.log("Resource not found");
  } else if (error.status >= 500) {
    console.log("Server error");
  } else {
    console.log("Client error:", error.message);
  }
}
```

## Configuration Options

### Request Configuration

```typescript
interface RequestConfig {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: any;
  signal?: AbortSignal;
  cache?: RequestCache;
  credentials?: RequestCredentials;
}
```

### Example with Custom Headers

```typescript
const data = await api.callApi("/endpoint", requestBody, {
  headers: {
    "Custom-Header": "value",
    "Another-Header": "another-value",
  },
  signal: abortController.signal,
});
```

## Migration Examples

### Before (Raw Fetch)

```typescript
// ❌ Old approach - no automatic 401 handling
const response = await fetch("/api/my-endpoint", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    data: myData,
    RequestInfo: {
      authToken: token,
      userInfo: user,
    },
  }),
});

if (response.status === 401) {
  // Manual logout handling
  logout();
  return;
}

if (!response.ok) {
  throw new Error("API call failed");
}

const data = await response.json();
```

### After (API Wrapper)

```typescript
// ✅ New approach - automatic 401 handling
const data = await api.callApi("/my-endpoint", { data: myData });
```

### Before (Auth Context)

```typescript
// ❌ Old approach - limited to auth context
const { makeApiCall } = useAuth();
const data = await makeApiCall("/my-endpoint", myData);
```

### After (API Wrapper)

```typescript
// ✅ New approach - usable anywhere, better error handling
const data = await api.callApi("/my-endpoint", myData);
```

## Best Practices

### 1. Use TypeScript Types

```typescript
interface MyApiResponse {
  items: Array<{ id: string; name: string }>;
  total: number;
}

const response = await api.callApi<MyApiResponse>("/my-endpoint");
// response is now properly typed
```

### 2. Handle Loading States

```typescript
const [loading, setLoading] = useState(false);

const fetchData = async () => {
  setLoading(true);
  try {
    const data = await api.callApi("/my-endpoint");
    setData(data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### 3. Use AbortController for Cleanup

```typescript
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const data = await api.callApi(
        "/my-endpoint",
        {},
        {
          signal: controller.signal,
        }
      );
      setData(data);
    } catch (error) {
      if (error.name !== "AbortError") {
        setError(error.message);
      }
    }
  };

  fetchData();

  return () => controller.abort();
}, []);
```

### 4. Conditional API Calls

```typescript
const api = useApiClient();

if (api.isAuthenticated) {
  // Safe to make authenticated calls
  const data = await api.callApi("/protected-endpoint");
}
```

## Troubleshooting

### Common Issues

#### 1. "Not authenticated" Error

- Ensure user is logged in before making authenticated calls
- Check that AuthProvider is properly initialized

#### 2. TypeScript Errors

- Provide proper response types: `api.callApi<MyType>(...)`
- Check that endpoints start with `/` for relative URLs

#### 3. CORS Issues

- Ensure your API endpoints are properly configured
- Check that the proxy configuration is correct

#### 4. Session Not Expiring on 401

- Verify that `setGlobalLogoutCallback` is called in AuthProvider
- Check browser console for any errors during logout

### Debug Information

Enable debug logging:

```typescript
// Temporary debug - check what's being sent
const response = await api.getFullResponse("/my-endpoint", data);
console.log("Request details:", {
  status: response.status,
  headers: response.headers,
  data: response.data,
});
```

## Integration with Existing Code

The API wrapper is designed to be gradually adopted:

1. **Keep existing code working** - Old `useAuth().makeApiCall` still works
2. **Migrate incrementally** - Update components one by one
3. **Consistent behavior** - All API calls get automatic 401 handling
4. **Better error handling** - More detailed error information

### Migration Checklist

- [ ] Replace direct `fetch` calls with `api.callApi` or appropriate method
- [ ] Replace `useAuth().makeApiCall` with `useApiClient().callApi`
- [ ] Add proper TypeScript types for API responses
- [ ] Update error handling to use the new error format
- [ ] Test 401 scenarios to ensure logout works correctly
