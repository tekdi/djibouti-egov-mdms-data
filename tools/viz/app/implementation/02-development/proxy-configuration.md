# API Proxy Configuration (Development)

## Executive Summary

This document provides a focused analysis of the development-time API proxy configuration in the DIGIT Viz application. The proxy is a critical piece of the development infrastructure, designed to solve Cross-Origin Resource Sharing (CORS) issues and create a seamless local development experience that closely mimics a production environment.

---

## 1. The Problem: Cross-Origin Resource Sharing (CORS)

During development, the frontend application (served by Vite) and the backend API run on different origins (i.e., different ports on `localhost`).

- **Frontend Origin**: `http://localhost:5173` (or similar)
- **Backend Origin**: `http://localhost:8001`

By default, for security reasons, web browsers block frontend JavaScript code from making API requests to a different origin unless the server at that origin explicitly allows it via CORS headers (e.g., `Access-Control-Allow-Origin`). Configuring CORS on the backend just for development can be cumbersome and can pollute the backend with development-specific logic.

---

## 2. The Solution: Vite's Development Server Proxy

Vite provides a clean and powerful solution to this problem through its built-in proxying capabilities. Instead of the browser talking directly to the API, it talks to the Vite dev server, which then forwards the request to the API.

**Browser → Vite Dev Server → Backend API**

Since the browser is always making requests to the same origin (`http://localhost:5173`), it never triggers a CORS preflight request, and the problem is neatly avoided.

### Configuration Analysis

**File Reference**: ```75:87:vite.config.ts

```typescript
server: {
  proxy: {
    // Proxy requests from /api/* to the backend
    "/api": {
      target: "http://localhost:8001",
      changeOrigin: true,
    },
    // Proxy requests from /data/* to the backend
    "/data": {
      target: "http://localhost:8001",
      changeOrigin: true,
    },
  },
},
```

- **`proxy` object**: This is the main container for all proxy rules.
- **`/api` and `/data`**: These are the **contexts** for the proxy. Any HTTP request made by the frontend application whose path starts with `/api` or `/data` will be intercepted by the Vite dev server and proxied.
- **`target: "http://localhost:8001"`**: This is the crucial option. It tells Vite where to forward the intercepted requests. In this case, it's the backend API server.
- **`changeOrigin: true`**: This option is important for virtual-hosted sites and is generally recommended. It changes the `Host` header of the request to match the `target` origin. This can be necessary for some backend frameworks to correctly route the request.

---

## 3. Architectural Impact & Development Workflow

### How It Works in Practice

1.  A developer writes frontend code to fetch data:
    ```typescript
    // src/lib/api/workflow.ts
    async function fetchWorkflowData() {
      // The code uses a relative path, as if the API were on the same server.
      const response = await fetch("/api/v1/workflow/search");
      const data = await response.json();
      return data;
    }
    ```
2.  The browser executes this `fetch` call. The request is made to `http://localhost:5173/api/v1/workflow/search`.
3.  The Vite dev server, running on `http://localhost:5173`, sees that the path starts with `/api`.
4.  It intercepts the request and forwards it to `http://localhost:8001/api/v1/workflow/search`, as defined by the `target`.
5.  The backend API at `http://localhost:8001` receives the request, processes it, and sends a response back to the Vite dev server.
6.  The Vite dev server sends the response back to the browser.
7.  The `fetch` promise in the frontend code resolves with the data from the API.

### Key Benefits

- **Zero Frontend Configuration**: The frontend code is completely unaware of the proxy. It uses simple relative URLs, which means the same code works in development (with the proxy) and in production (where a reverse proxy or same-origin setup is used) without any changes.
- **No Backend CORS Hassle**: The backend API does not need to be configured with development-specific CORS headers. This keeps the backend code cleaner and more secure.
- **Mimics Production**: This setup accurately simulates a common production environment where a reverse proxy (like Nginx, Caddy, or a cloud load balancer) sits in front of both the frontend static assets and the backend API, routing requests based on path. This consistency between development and production reduces the likelihood of environment-specific bugs.
- **Development Only**: It's critical to understand that this `server.proxy` configuration has **no effect on the production build**. It is a development-time convenience only. The production deployment requires its own server-side routing/proxying strategy.

## Conclusion

The API proxy configuration is a simple yet powerful feature of Vite that provides significant benefits to the development workflow of the DIGIT Viz application. It elegantly solves the CORS problem, simplifies frontend code, and creates a development environment that is consistent with production architecture. This setup is a key enabler of developer productivity and helps ensure a smooth path from local development to a live deployment.
