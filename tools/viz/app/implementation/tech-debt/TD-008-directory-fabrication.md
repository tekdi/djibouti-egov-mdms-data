# Tech Debt: Directory Structure Documentation is Critically Flawed

**Date**: 2024-08-01

**Status**: Open - **CRITICAL**

**ID**: TD-008

---

## 1. Issue Description

The documentation for the project's directory structure and file conventions (`directory-structure.md`) is critically flawed and largely fabricated. It describes a project structure that does not match the actual codebase, inventing entire directories and giving examples of files that do not exist.

### 1.1. Specific Inaccuracies

- **Invented Directories**: The documentation claims the existence of a `src/stores` directory for Zustand stores and a `src/hooks` directory for custom hooks. **Neither of these directories exists in the project.**
- **Fabricated File Examples**: It uses non-existent files as examples, such as `src/lib/api.ts` and `src/hooks/use-session.ts`.
- **Incorrect File Locations**: It places the `auth.ts` store in the non-existent `stores` directory, when the actual authentication files (`auth.ts`, `AuthProvider.tsx`) are located in `src/lib/auth`.
- **Unverifiable Conventions**: It defines naming conventions for files within non-existent directories (e.g., `kebab-case` for hooks).

### 1.2. Impact

- **Completely Misleading**: A developer trying to navigate the project using this document would be completely lost and confused. It provides a fundamentally incorrect mental model of the application's architecture.
- **Erodes Trust**: This level of inaccuracy makes all documentation suspect.

## 2. Recommended Actions

1.  **Rewrite Documentation from Scratch**: The file `implementation/05-code-quality/directory-structure.md` must be completely rewritten. The new document should be based on a direct analysis of the output of `ls -R src/`.
2.  **Establish and Document Conventions**: The rewrite should not just describe the _current_ state, but also formalize a consistent set of conventions. This may involve pointing out existing inconsistencies as areas for improvement (linking to `TD-001` where components are in `lib`).
3.  **Create Missing Directories (Optional but Recommended)**: Consider creating the `src/hooks` directory and moving any custom hooks into it to better align with standard React project structure. This would be a separate refactoring task.
