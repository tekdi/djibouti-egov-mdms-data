# Tech Debt: Inconsistent Code Structure and Export Conventions

**Date**: 2024-08-01

**Status**: Open

**ID**: TD-001

---

## 1. Issue Description

A validation of the codebase against the architectural documentation (`module-system.md`) has revealed two key areas where the code deviates from documented best practices and internal consistency.

### 1.1. Inconsistent Directory Structure

- **Problem**: React components, specifically `LoginPage.tsx` and `AuthProvider.tsx`, are located in `src/lib/auth`. The `lib` directory is conventionally reserved for non-UI, reusable logic, library configurations, and utility functions. Placing components here violates the principle of separation of concerns and makes the codebase harder to navigate.
- **Furthermore**: The global Zustand store (`auth.ts`) is also located in `src/lib/auth`. While related to auth, global stores should ideally reside in a dedicated `src/stores` directory to make them easily discoverable.

### 1.2. Inconsistent Export Conventions

- **Problem**: The documentation specifies that page components should use `default` exports. However, this is not consistently applied. For example, `HomePage.tsx` uses a `named` export (`export function HomePage...`), while `Layout.tsx` uses a `default` export.
- **Impact**: This inconsistency makes the codebase less predictable. Developers cannot reliably know whether to use `import Page from './Page'` or `import { Page } from './Page'`.

---

## 2. Technical Impact

- **Reduced Maintainability**: An inconsistent and unconventional directory structure makes it harder for new developers (and AI agents) to understand the project's layout and locate files.
- **Increased Cognitive Load**: Developers have to remember the specific exceptions to the structure and export rules, slowing down development.
- **Potential for Errors**: Inconsistent exports can lead to confusion and import errors.

---

## 3. Recommended Remediation

### 3.1. Refactor Directory Structure

1.  Create a new directory: `src/auth`.
2.  Move `src/lib/auth/LoginPage.tsx` to `src/pages/LoginPage.tsx`.
3.  Move `src/lib/auth/AuthProvider.tsx` to `src/auth/AuthProvider.tsx`.
4.  Create a new directory: `src/stores`.
5.  Move `src/lib/auth/auth.ts` (the Zustand store) to `src/stores/auth.store.ts`.
6.  Update all imports across the application to point to the new file locations.

### 3.2. Standardize Export Convention

1.  Decide on a single convention for all page and layout components. **Recommendation**: Use `default` exports for components that are the single, primary export of a file (which applies to all pages and layouts).
2.  Refactor all page components in `src/pages/` to use `default` exports.
    - **Example Change in `HomePage.tsx`**:
      ```diff
      - export function HomePage() { ... }
      + export default function HomePage() { ... }
      ```
3.  Update the corresponding route definitions in `App.tsx` if necessary (lazy loading imports would need to be adjusted).
