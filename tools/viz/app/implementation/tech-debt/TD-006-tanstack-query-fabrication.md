# Tech Debt: Server-Side State Documentation is a Complete Fabrication

**Date**: 2024-08-01

**Status**: Open - **CRITICAL**

**ID**: TD-006

---

## 1. Issue Description

The documentation for the server-side state management strategy (`server-side-state-tanstack-query.md`) is entirely inaccurate. It describes a detailed architecture based on the **TanStack Query (React Query)** library, including a `QueryClientProvider` setup and examples of `useQuery` and `useMutation` hooks.

The actual codebase does **not** use TanStack Query for data fetching. It is not listed as a dependency in `package.json`. The application appears to use the `makeApiCall` function from the `AuthProvider` for all data fetching.

### 1.1. Specific Inaccuracies

- **Wrong Library**: The documentation is written for TanStack Query, which is not used in the project.
- **Wrong Dependency**: It references the fabricated Axios documentation.
- **Fabricated Code**: The `QueryClientProvider` setup and all `useQuery`/`useMutation` hook examples are completely fabricated and do not exist in the project.

### 1.2. Impact

- **Completely Misleading**: This documentation invents a sophisticated data-caching layer that does not exist. Any developer trying to fetch data would be fundamentally misled about how the application works.
- **Architectural Confusion**: It creates a false picture of how the application handles server state, caching, and data synchronization.

## 2. Recommended Actions

1.  **Delete Incorrect Documentation**: The file `implementation/04-data-state-management/server-side-state-tanstack-query.md` must be deleted immediately.
2.  **Enhance Existing Documentation**: The `authentication-and-state.md` document, which correctly describes the `makeApiCall` function, is the single source of truth for data fetching. This document should be reviewed to ensure it sufficiently covers the data fetching pattern for the entire application. No new, separate document is needed.
