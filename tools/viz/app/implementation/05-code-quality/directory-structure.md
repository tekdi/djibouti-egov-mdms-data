# Directory Structure & File Conventions

## Executive Summary

This document outlines the directory structure and file naming conventions for the DIGIT Viz application. A well-organized and consistent structure is critical for maintainability, scalability, and developer experience. It allows developers (both human and AI) to quickly locate files and understand the application's architecture.

**Note**: _This document describes the current state of the project. Several inconsistencies have been identified and are tracked in [TD-001](mdc:tools/viz/app/implementation/tech-debt/TD-001-structure-and-exports.md) and [TD-008](mdc:tools/viz/app/implementation/tech-debt/TD-008-directory-fabrication.md)._

---

## 1. `src` Directory Structure

The `src` directory is the heart of the application. The actual structure is as follows:

```
src/
├── App.tsx
├── App.css
├── index.css
├── vite-env.d.ts
├── assets/
├── components/
│   ├── ui/
│   ├── data-explorer/
│   ├── layout/
│   ├── localization/
│   ├── workflow/
│   └── (other general components)
├── lib/
│   ├── api/
│   ├── auth/
│   └── utils.ts
└── pages/
```

---

## 2. Detailed Breakdown of Key Directories

### `src/components/`

This directory contains all React components. It is further subdivided by feature or function:

- **`src/components/ui/`**: Contains all the base UI components from **shadcn/ui** (e.g., `button.tsx`, `card.tsx`). These are the foundational, reusable building blocks.
- **`src/components/layout/`**: Contains components that define the main application layout, such as `Header.tsx` and `Sidebar.tsx`.
- **`src/components/(feature)/`**: Feature-specific components are grouped into their own folders (e.g., `data-explorer/`, `workflow/`). This co-locates related UI code.
- **`src/components/` (Root)**: Contains general-purpose, reusable components not tied to a specific feature (e.g., `Layout.tsx`, `ThemeToggle.tsx`).

### `src/pages/`

- **Purpose**: Contains the top-level components for each route in the application.
- **Convention**: Each file typically corresponds to one page. These components are responsible for composing the page's UI from the components in the `components` directory.
- **Example**: `HomePage.tsx`, `DataExplorer.tsx`, `WorkflowVisualizer.tsx`.

### `src/lib/`

- **Purpose**: Contains shared, non-UI logic, configurations, and utilities.
- **`lib/api/`**: Contains functions related to fetching data for specific domains (e.g., `roleActionApi.ts`).
- **`lib/auth/`**: Contains the core authentication logic, including the `AuthContext` (`auth.ts`) and the `AuthProvider.tsx` component. **Note**: It also contains the `LoginPage.tsx` component, which is an structural inconsistency tracked in [TD-001](mdc:tools/viz/app/implementation/tech-debt/TD-001-structure-and-exports.md).
- **`lib/utils.ts`**: Contains global utility functions, most notably the `cn` function for merging Tailwind classes.

### `src/assets/`

- **Purpose**: Contains static assets like images (SVGs, PNGs) and fonts.

---

## 3. File Naming Conventions

The project follows these naming conventions:

1.  **Component Files**: **PascalCase** (`MyComponent.tsx`).

    - Examples: `DataTable.tsx`, `Header.tsx`, `HomePage.tsx`.

2.  **Utility and Logic Files**: **camelCase** (`myUtils.ts`).
    - Examples: `utils.ts`, `roleActionApi.ts`.

---

## 4. Path Aliasing

The project uses the `@/` alias for absolute imports from the `src` directory, configured in `tsconfig.json`.

- **Convention**: Always use the `@/` alias to avoid long, fragile relative paths.

- **❌ Bad**: `import { Button } from '../../components/ui/button';`
- **✅ Good**: `import { Button } from '@/components/ui/button';`

## Conclusion

This structured approach to file organization, while having some noted inconsistencies, provides a generally clear mental model of the application. Adhering to the conventions outlined here is essential for maintaining and scaling the project.
