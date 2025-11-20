# Shared Authentication Migration Guide

This guide shows how to migrate existing visualization tools to use the shared `auth.js` module.

## Files Created

- `tools/viz/auth.js` - Shared authentication module
- `tools/viz/role-action-visualizer.html` - Updated to use shared auth

## Key Benefits

✅ **Single Source of Truth** - All auth logic in one place  
✅ **Consistent UI** - Same login experience across tools  
✅ **Easy Maintenance** - Update auth logic once, affects all tools  
✅ **Persistent Sessions** - localStorage-based token management  
✅ **Automatic Logout** - Handles expired tokens gracefully

## How to Use in New Tools

### 1. Include the Auth Module

```html
<script src="auth.js"></script>
```

### 2. Initialize Authentication

```javascript
// Initialize shared authentication system
const auth = window.DigitAuth.createAuthSystem();

document.addEventListener("DOMContentLoaded", function () {
  // Initialize with callbacks
  const isAuthenticated = auth.init(
    // onLoginSuccess callback
    (userInfo) => {
      console.log("User logged in:", userInfo);
      // Load your tool's data here
      loadData();
    },
    // onLogout callback
    () => {
      console.log("User logged out");
      // Clear your tool's data here
      clearData();
    }
  );

  // If already authenticated, load data
  if (isAuthenticated) {
    loadData();
  }
});
```

### 3. Make API Calls

```javascript
// Replace your existing makeApiCall function with:
async function makeApiCall(endpoint, data) {
  return await auth.makeApiCall(endpoint, data);
}

// Use tenant ID from shared config:
const tenantId = window.DigitAuth.AUTH_CONFIG.TENANT_ID;
```

### 4. Remove Old Auth Code

Remove these from your existing tools:

- Login overlay HTML
- User info bar HTML
- Login/logout CSS styles
- OAuth configuration constants
- Authentication functions
- Manual token management

## Migration Example for Localization Visualizer

### Before (Current Code):

```javascript
// Old auth state
let accessToken = localStorage.getItem("egov_token");
let userInfo = JSON.parse(localStorage.getItem("egov_userInfo") || "null");

// Old login function
async function loginUser(username, otp) {
  // ... manual OAuth implementation
}

// Old makeApiCall
async function makeApiCall(endpoint, data) {
  // ... manual token handling
}
```

### After (Using Shared Auth):

```javascript
// New auth system
const auth = window.DigitAuth.createAuthSystem();

// Simplified makeApiCall
async function makeApiCall(endpoint, data) {
  return await auth.makeApiCall(endpoint, data);
}

// Auto-initialization
document.addEventListener("DOMContentLoaded", function () {
  auth.init(onLoginSuccess, onLogout);
});
```

## API Reference

### AuthManager Methods

- `isAuthenticated()` - Check if user is logged in
- `getUserInfo()` - Get current user details
- `getAccessToken()` - Get current auth token
- `login(username, otp)` - Login with credentials
- `logout()` - Clear session and logout
- `makeApiCall(endpoint, data)` - Make authenticated API call

### Auth System Methods

- `auth.init(onLoginSuccess, onLogout)` - Initialize with callbacks
- `auth.isAuthenticated()` - Check auth status
- `auth.makeApiCall(endpoint, data)` - Make API call
- `auth.logout()` - Logout user

### Configuration

```javascript
window.DigitAuth.AUTH_CONFIG = {
  API_BASE: "https://djibouti.tekdinext.com",
  LOGIN_URL: "https://djibouti.tekdinext.com/user/oauth/token",
  TENANT_ID: "dj",
  USER_TYPE: "EMPLOYEE",
  CLIENT_AUTH: "Basic ZWdvdi11c2VyLWNsaWVudDo=",
};
```

## UI Components

The shared auth module automatically provides:

- **Login Overlay** - Appears when authentication is needed
- **User Info Bar** - Shows logged-in user details at top of page
- **Logout Button** - Allows users to sign out
- **Error Handling** - Displays login errors and session expiry messages

## Security Features

- **Token Persistence** - Uses localStorage for cross-session storage
- **Automatic Expiry** - Detects 401/403 responses and auto-logout
- **Secure Storage** - Tokens stored securely in browser storage
- **Session Management** - Handles token refresh and validation

## Next Steps

1. ✅ Role-Action Visualizer - **Already migrated**
2. ⏳ Localization Visualizer - Ready to migrate
3. ⏳ Future Tools - Will use shared auth from start

This shared authentication system provides a solid foundation for all DIGIT visualization tools!
