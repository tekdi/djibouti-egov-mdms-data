# Frontend Migration Plan: `tools/viz`

This document tracks the migration of the visualization tools from a legacy stack (HTML, vanilla JS, CSS) to a modern stack (Vite, React, TypeScript, shadcn/ui).

## Done

- **Project Scaffolding**
  - [x] Set up a new Vite + React + TypeScript project in `tools/viz/app`.
  - [x] Integrated `shadcn/ui` for the component library.
- **Core Architecture**
  - [x] Implemented client-side routing using `react-router-dom`.
  - [x] Migrated authentication logic to a React context-based `AuthProvider`.
  - [x] Created a main `Layout.tsx` component with a header and sidebar.
  - [x] Updated the Node.js server (`server.js`) to serve the new React application and handle API proxying.
- **Feature Migration: Workflow Visualizer**
  - [x] Re-implemented the Workflow Visualizer page.
  - [x] Integrated Monaco Editor for JSON input.
  - [x] Integrated Mermaid.js for diagram rendering.
  - [x] Implemented resizable panels for the editor and preview panes.
  - [x] Fixed vertical scrolling and layout bugs.
- **Layout Enhancements**
  - [x] Replaced the basic layout with a collapsible sidebar component from shadcn/ui.

## To Do

- **Bug Fixes**
  - [ ] **Workflow Visualizer**: Fix the issue where switching between "Code" and "Preview" tabs breaks the Mermaid diagram preview.
- **Feature Parity Migration**
  - [x] Migrate **Role-Action Visualizer**.
  - [x] Migrate **Localization Visualizer**.
  - [x] Migrate **Data Explorer**.
- **Code Cleanup**
  - [ ] Once all features are migrated, remove the old, unused files and directories from `tools/viz/` (e.g., `index.html`, `workflow-visualizer.html`, old `src/` files).
- **Documentation**
  - [ ] Add a README to the new `tools/viz/app` directory explaining how to run the new development server and build the application.
