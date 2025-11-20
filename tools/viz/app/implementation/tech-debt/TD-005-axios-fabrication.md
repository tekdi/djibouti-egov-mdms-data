# Tech Debt: API Communication Documentation is a Complete Fabrication

**Date**: 2024-08-01

**Status**: Open - **CRITICAL**

**ID**: TD-005

---

## 1. Issue Description

The documentation for the API communication strategy (`api-communication-axios.md`) is entirely inaccurate. It describes a detailed architecture based on a singleton **Axios** instance with a request interceptor that pulls an authentication token from a **Zustand** store.

The actual codebase does **not** use Axios or Zustand. The API communication is handled by a `makeApiCall` function within the `AuthProvider` component, which uses the native **`fetch`** API and gets the token from its own React state.

### 1.1. Specific Inaccuracies

- **Wrong Library**: The documentation is written for Axios, but the code uses `fetch`.
- **Wrong File Path**: The documentation points to `src/lib/api.ts`, which does not exist.
- **Wrong Authentication Logic**: The documentation describes an interceptor using a non-existent Zustand store. The actual logic is inside `AuthProvider.tsx`.
- **Fabricated Code**: The code examples of the Axios instance and its usage with TanStack Query are completely fabricated and do not exist in the project.

### 1.2. Impact

- **Completely Misleading**: This documentation sends any developer down a completely incorrect path for understanding how the application communicates with the backend.
- **Architectural Confusion**: It invents a data layer that does not exist, creating a false picture of the application's architecture.

## 2. Recommended Actions

1.  **Delete Incorrect Documentation**: The file `implementation/04-data-state-management/api-communication-axios.md` must be deleted immediately.
2.  **Consolidate Correct Documentation**: The _actual_ API communication logic is the `makeApiCall` function inside `AuthProvider`. This has already been correctly documented in the new `authentication-and-state.md` file. No new, separate document is needed. This consolidation correctly reflects that the API client is tightly coupled with the authentication state.
