# Environment Configuration & Management

## Executive Summary

This document outlines the environment configuration strategy for the DIGIT Viz application. The approach prioritizes security, consistency between environments, and a smooth developer experience. It leverages Vite's built-in capabilities for managing environment variables and configuring environment-specific behavior.

---

## 1. Environment Variable Management

Vite exposes environment variables on the special `import.meta.env` object. To prevent accidental leaking of environment variables to the client, only variables prefixed with `VITE_` are exposed.

### Philosophy

- **Security First**: Sensitive keys (API secrets, private keys) are **never** stored in the repository or exposed directly to the client-side code. They should be handled by a backend service or build-time substitution in a secure CI/CD environment.
- **Client-Safe Variables**: Only non-sensitive, public configuration should be prefixed with `VITE_` and used in the frontend code.

### `.env` Files

Vite uses `dotenv` to load environment variables from the following files in the project root:

```
.env                # Loaded in all cases
.env.local          # Loaded in all cases, ignored by git
.env.[mode]         # Only loaded in the specified mode
.env.[mode].local   # Only loaded in the specified mode, ignored by git
```

- **`.env`**: Contains default variables for the project. This file **should be** committed to version control.
  - _Example_: `VITE_APP_TITLE="DIGIT Viz"`
- **`.env.local`**: Contains variables that override the defaults for a specific local machine. This file **must not** be committed (`.gitignore`).
  - _Example_: `VITE_API_BASE_URL="http://localhost:9090/api"` (if a developer is running a custom local backend).
- **`.env.development`**: Contains variables specific to development mode.
  - _Example_: `VITE_ENABLE_MOCK_API=true`
- **`.env.production`**: Contains variables specific to the production build.
  - _Example_: `VITE_API_BASE_URL="https://prod.digit.org/api"`

### Type-Safe Environment Variables

To ensure type safety and provide autocompletion for environment variables, their types are declared.

**File Reference**: ```1:2:src/vite-env.d.ts

```typescript
/// <reference types="vite/client" />
```

- **Architectural Impact**: This triple-slash directive imports Vite's client types. We can extend this file to provide types for our custom `VITE_` prefixed variables, preventing typos and ensuring that developers use the correct variable names.

  ```typescript
  // Example extension in src/vite-env.d.ts
  interface ImportMetaEnv {
    readonly VITE_APP_TITLE: string;
    readonly VITE_API_BASE_URL: string;
    // more env variables...
  }
  ```

---

## 2. Environment-Specific Logic

### Development vs. Production Modes

Vite automatically sets `import.meta.env.DEV` to `true` in development and `import.meta.env.PROD` to `true` in production. This allows for environment-specific code paths.

```typescript
// Example of environment-specific logic
function getApiEndpoint() {
  if (import.meta.env.DEV) {
    // In development, we can use a mock endpoint or add extra logging
    console.log("Using development API endpoint.");
    return "/api/dev";
  } else {
    // In production, use the production endpoint
    return import.meta.env.VITE_API_BASE_URL;
  }
}
```

- **Tree-Shaking**: Vite's build process is intelligent. The `if (import.meta.env.DEV)` block will be completely removed from the production bundle (dead code elimination), ensuring that development-only code does not ship to production.

---

## 3. Key Environment Configurations in this Project

### Development Proxy

**File Reference**: ```75:87:vite.config.ts

- **Purpose**: This is a **development-only** configuration. The `server.proxy` option is not active in the production build.
- **Behavior**: It solves the CORS problem during local development by forwarding API requests from the Vite dev server to the backend API server. In production, this is typically handled by a reverse proxy (like Nginx or Caddy) or by serving the frontend and backend from the same domain.
- **Architectural Impact**: This creates a seamless development experience that closely mirrors a typical production setup, without requiring complex CORS configurations on the backend for development purposes.

### PWA Configuration

**File Reference**: ```20:22:vite.config.ts

```typescript
devOptions: {
  enabled: true,
},
```

- **Purpose**: This is another **development-only** setting within the PWA plugin.
- **Behavior**: It enables the service worker to be generated and tested during development. By default, the PWA plugin might only run for production builds. This ensures that PWA features can be debugged effectively before a production release.

---

## Conclusion

The environment configuration for DIGIT Viz is robust and follows modern best practices. It provides:

- A secure way to manage environment variables using `.env` files and `VITE_` prefixes.
- Type safety for environment variables to improve developer experience.
- Clear separation of development and production logic through Vite's built-in mode variables.
- Development-time tools like the proxy server that simplify local setup without impacting the production build.

This strategy ensures that the application is easy to configure for different environments, secure by default, and optimized for both development speed and production performance.
