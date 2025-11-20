# Module System & Path Resolution

## Executive Summary

This document details the module organization and path resolution strategy for the DIGIT Viz application. The architecture is designed to be scalable, maintainable, and developer-friendly, leveraging TypeScript path mapping and a feature-based directory structure to create a clean and predictable codebase.

---

## 1. Directory Structure Philosophy

The `src` directory is organized by feature and function, which is a hybrid approach that provides a clear separation of concerns while keeping related files co-located.

**File Reference**: `src/` directory structure (_Note: See [Tech Debt TD-001](mdc:tools/viz/app/implementation/tech-debt/TD-001-structure-and-exports.md) for recommended improvements to this structure._)

```
src/
├── assets/            # Static assets (images, fonts, etc.)
│
├── components/          # Reusable UI components (The "Dumb" Components)
│   ├── ui/             # Core UI Kit from shadcn/ui (Button, Card, etc.)
│   ├── auth/           # Components related to authentication (e.g., UserMenu)
│   ├── layout/         # Layout structure components (e.g., Header, Sidebar)
│   └── (feature)/      # Feature-specific reusable components
│
├── lib/                # Shared libraries, hooks, and core logic
│   ├── auth/           # Authentication logic (AuthProvider, hooks)
│   ├── api/            # API client and data fetching logic
│   └── utils.ts        # Global utility functions (e.g., cn)
│
├── pages/              # Top-level route components (The "Smart" Components)
│                       # Each file here typically corresponds to a unique URL
│
├── types/              # Global TypeScript type definitions
│
├── App.tsx             # Main application component and router setup
└── main.tsx            # Application entry point
```

### Rationale for this Structure

- **Separation of Concerns**:
  - `pages/`: Handle **what** to display (data fetching, state management connection).
  - `components/`: Handle **how** to display it (rendering UI, receiving props).
  - `lib/`: Handle reusable business logic and external integrations.
- **Scalability**: New features can be added by creating a new file in `pages/` and a corresponding directory in `components/` and `lib/` if needed, without disrupting existing code.
- **Discoverability**: It's easy for developers to find files. If you're looking for UI, you go to `components`. If you're looking for page-level logic, you go to `pages`.

---

## 2. Path Resolution & Module Aliases

The application employs a robust path aliasing strategy to simplify imports and improve maintainability.

### Configuration

**File Reference**: ```69:74:vite.config.ts

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
},
```

**File Reference**: ```7:13:tsconfig.json

```json
"compilerOptions": {
  "baseUrl": ".",
  "paths": {
    "@/*": ["./src/*"]
  }
}
```

- **Dual Configuration**: The alias is configured in both `vite.config.ts` (for Vite's module resolver) and `tsconfig.json` (for TypeScript's language server). This ensures that both the build tool and the IDE/type-checker understand the `@/` alias.

### Architectural Benefits & Usage Patterns

- **Avoids Relative Path Hell**: This is the primary benefit. Instead of fragile and hard-to-read relative imports like `import Button from '../../../../components/ui/Button'`, we use clean, absolute paths.

  ```typescript
  // ❌ Anti-Pattern (Fragile and hard to read)
  import { Layout } from "../../components/layout/Layout";
  import { cn } from "../../lib/utils";

  // ✅ Best Practice (Clean, absolute, and maintainable)
  import { Layout } from "@/components/layout/Layout";
  import { cn } from "@/lib/utils";
  ```

- **Improves Refactoring**: If a file is moved, its internal imports using the `@/` alias do not need to be updated. This significantly reduces the friction and risk of refactoring.

- **Enforces Structure**: The use of aliases encourages developers to think about the codebase in a structured way, importing from well-defined entry points within the `src` directory.

---

## 3. Import & Export Strategy

The project follows a clear strategy for how modules expose their functionality.

### Barrel Exports (`index.ts`) - Used Sparingly

Barrel files (`index.ts` that re-export modules from a directory) are used sparingly and strategically.

- **When to Use**: For core UI libraries or a small set of related utilities where consumers are likely to need multiple exports from the same module.

  - Example: The shadcn/ui components in `components/ui` are often imported together.

- **When to Avoid**: For large feature directories. Creating a barrel file for an entire feature can lead to large, unintentionally coupled modules and can negatively impact tree-shaking and lazy loading.

### Default vs. Named Exports

A convention is followed, but it is inconsistent across the codebase, representing a point of technical debt. (_Note: See [Tech Debt TD-001](mdc:tools/viz/app/implementation/tech-debt/TD-001-structure-and-exports.md) for details._)

- **`default` exports**: Used for the **primary export** of a file, typically the main component in a component file. This is the recommended pattern but is not universally applied.

- **`named` exports**: Used for **secondary or supporting exports** from a file, such as interfaces, constants, or helper functions. Also used for some page components, contrary to the recommended convention.

---

## 4. Code Splitting & Dynamic Imports

The module system is designed to support efficient code splitting.

- **Route-based Splitting**: While not yet explicitly implemented with `React.lazy`, the application's structure is perfectly set up for it. The `pages/` directory acts as the splitting point.

  ```typescript
  // Future Enhancement Example
  import { lazy } from "react";

  const HomePage = lazy(() => import("@/pages/HomePage"));
  const Dashboard = lazy(() => import("@/pages/Dashboard"));

  // In App.tsx
  <Route
    path="/"
    element={
      <Suspense fallback={<Loader />}>
        <HomePage />
      </Suspense>
    }
  />;
  ```

  - **Architectural Impact**: By organizing code into page-level components, the application ensures that users only download the code for the page they are currently viewing. This is the single most effective strategy for reducing initial bundle size and improving load times.

- **Component-based Splitting**: For very large or rarely used components (e.g., a complex data visualization or a rich text editor), dynamic imports can be used to load them on demand.

---

## Conclusion

The module system and path resolution strategy in DIGIT Viz create a robust, scalable, and developer-friendly foundation. The combination of a logical directory structure, path aliases, consistent import/export patterns, and a clear path to code splitting ensures that the codebase can grow in complexity without sacrificing maintainability or performance. This structured approach is critical for the long-term health of the project.
