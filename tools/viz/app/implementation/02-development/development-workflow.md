# Development Workflow

## Executive Summary

This document outlines the standard development workflow for the DIGIT Viz application. It covers the local development setup, available scripts, and the process for contributing code. The workflow is optimized for developer productivity, code quality, and consistency, leveraging the features of Vite, TypeScript, and ESLint.

---

## 1. Local Development Setup

### Prerequisites

- **Node.js**: A recent LTS version.
- **Package Manager**: `npm`, `yarn`, or `bun`. The project contains a `bun.lockb` file, indicating `bun` is a preferred option for dependency management and script execution due to its speed.

### Initial Setup Steps

1.  **Clone the Repository**:

    ```bash
    git clone <repository-url>
    cd djibouti-egov-mdms-data/tools/viz/app
    ```

2.  **Install Dependencies**:

    ```bash
    # Recommended (fastest)
    bun install

    # Or with npm
    npm install
    ```

3.  **Environment Configuration**:

    - Create a `.env.local` file in the `tools/viz/app` directory. This file is ignored by Git and is used for local overrides.
    - Copy the contents from `.env` if it exists, or create the necessary variables. At a minimum, you might need to configure the local API endpoint if it differs from the proxy's default target.
      ```
      # tools/viz/app/.env.local
      VITE_API_BASE_URL=http://localhost:8001
      ```

4.  **Start the Development Server**:
    ```bash
    bun run dev
    ```
    - This command will start the Vite development server, typically on `http://localhost:5173`.
    - The server features Hot Module Replacement (HMR) for instant updates in the browser as you code.
    - The API proxy configured in `vite.config.ts` will be active, forwarding API calls.

---

## 2. Core Scripts

The available scripts are defined in `package.json`.

**File Reference**: ```5:11:package.json

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview"
},
```

### `bun run dev`

- **Action**: Starts the Vite development server.
- **Usage**: This is the primary command used during development. Keep this running in a terminal window as you make code changes.

### `bun run build`

- **Action**: Executes the two-step production build process.
  1.  `tsc -b`: First, it runs the TypeScript compiler in "build mode" (`-b`), which type-checks the entire composite project. If any TypeScript errors are found, the build process stops here. This ensures type safety before creating a production build.
  2.  `vite build`: If type-checking passes, this command bundles the application, optimizes all assets (JS, CSS, images), and places the production-ready files in the `dist/` directory.
- **Usage**: This command is used to prepare the application for deployment.

### `bun run lint`

- **Action**: Runs ESLint to statically analyze the codebase for potential errors, style issues, and adherence to best practices. The configuration is defined in `eslint.config.js`.
- **Usage**: Should be run before committing code to ensure it meets the project's quality standards. Can be integrated into pre-commit hooks.

### `bun run preview`

- **Action**: Starts a simple local web server that serves the contents of the `dist/` directory.
- **Usage**: This command is for locally previewing the production build. It allows you to check the final, optimized version of the application before deploying it to a live server. It's useful for verifying that the build process worked correctly and for final performance testing.

---

## 3. Coding & Contribution Process

The standard workflow for developing a new feature or fixing a bug is as follows:

1.  **Create a Branch**: Start from the main branch and create a new feature branch.

    ```bash
    git checkout main
    git pull
    git checkout -b feature/my-new-feature
    ```

2.  **Develop**:

    - Run `bun run dev` to start the development server.
    - Implement the required changes, following the established architectural patterns (component structure, state management, etc.).
    - Write or update components in `src/components`, pages in `src/pages`, and logic in `src/lib`.
    - Ensure any new dependencies are added via `bun add <package-name>`.

3.  **Ensure Code Quality**:

    - As you code, your IDE (with the proper ESLint and TypeScript plugins) should provide live feedback.
    - Before committing, run the linter manually to catch any issues:
      ```bash
      bun run lint
      ```

4.  **Commit Changes**:

    - Stage your changes (`git add .`).
    - Write a clear and descriptive commit message following conventional commit standards if applicable.
      ```bash
      git commit -m "feat(workflow): Add new visualization node"
      ```

5.  **Test the Production Build (Optional but Recommended)**:

    - Run `bun run build` to ensure the application builds without errors.
    - Run `bun run preview` to test the final output locally.

6.  **Push and Create a Pull Request**:

    - Push your branch to the remote repository.
    - Open a Pull Request (PR) for review.
    - The PR should be reviewed by team members, and any automated CI checks (like linting and building) should pass.

7.  **Merge**: Once the PR is approved and all checks have passed, it can be merged into the main branch.

This workflow ensures that all code entering the codebase is type-checked, linted, and reviewed, maintaining a high standard of quality and stability.
