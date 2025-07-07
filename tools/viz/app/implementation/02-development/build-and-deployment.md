# Build & Deployment Pipeline

## Executive Summary

This document provides a detailed overview of the end-to-end build and deployment pipeline for the DIGIT Viz application. The pipeline is designed to be robust, efficient, and reliable, transforming the TypeScript and React source code into highly optimized static assets ready for production deployment. It leverages the power of Vite and TypeScript's build capabilities to ensure both code quality and performance.

---

## 1. The Build Command: A Two-Stage Process

The core of the pipeline is the `build` script in `package.json`.

**File Reference**: ```7:7:package.json

```json
"build": "tsc -b && vite build",
```

This command orchestrates a two-stage process, ensuring that the code is first validated for type safety and then bundled for production.

### Stage 1: Type Checking (`tsc -b`)

- **Command**: `tsc -b`
- **Purpose**: This command invokes the TypeScript compiler in "build mode" (`-b`).
- **Action**:
  1.  It reads the root `tsconfig.json` file.
  2.  It discovers the project references (`tsconfig.app.json` and `tsconfig.node.json`).
  3.  It performs a full, strict type-check on the entire application codebase as defined by these configurations.
  4.  It does **not** emit any JavaScript files (due to `"noEmit": true` in `tsconfig.app.json`). Its sole purpose is validation.
- **Architectural Significance**: This is the **quality gate** of the pipeline. If there are any TypeScript errors (e.g., type mismatches, nullability issues, incorrect prop types), the command will exit with an error, and the entire build process will fail. This prevents type-unsafe code from ever reaching the bundling stage, significantly reducing the risk of runtime errors in production.

### Stage 2: Bundling & Optimization (`vite build`)

- **Command**: `vite build`
- **Purpose**: This command uses Vite to bundle the application for production.
- **Action**: If and only if Stage 1 succeeds, Vite performs the following steps:
  1.  **Code Transpilation**: It transpiles all `.ts` and `.tsx` files into standard JavaScript, handling JSX transforms for React.
  2.  **Dependency Bundling**: It traces all `import` statements, starting from the entry point (`src/main.tsx`), and bundles all required application code and third-party dependencies from `node_modules` into a few optimized JavaScript files.
  3.  **Code Splitting**: It automatically splits the code based on dynamic import boundaries. By default, this creates separate chunks for each page defined in the React Router, ensuring that users only download the code for the page they visit.
  4.  **Tree Shaking**: It statically analyzes the code to identify and eliminate any "dead code"—functions, modules, or dependencies that are imported but never used. This is critical for keeping the final bundle size small.
  5.  **CSS Processing**: It runs Tailwind CSS to generate the required utility classes, then uses PostCSS to process the CSS. It purges all unused CSS classes from the final stylesheet, resulting in a very small CSS file.
  6.  **Asset Minification**: It minifies the final JavaScript and CSS bundles, removing whitespace, shortening variable names, and applying other optimizations to reduce file size.
  - **Static Asset Handling**: It copies any files from the `public/` directory and processes imported assets (like images or fonts), hashing their filenames for efficient long-term caching.
  8.  **PWA Generation**: It invokes `vite-plugin-pwa` to generate the `sw.js` (service worker) and `manifest.webmanifest` files, enabling Progressive Web App capabilities.

---

## 2. The Production Output (`dist/` directory)

After a successful build, the `dist/` directory is created with the following structure:

```
dist/
├── assets/
│   ├── index-*.js         # Main JavaScript bundle for the application
│   ├── index-*.css         # Main CSS bundle
│   ├── vendor-*.js         # Chunks for third-party libraries
│   └── (other chunks)...   # Code-split chunks for different pages/features
│
├── index.html              # The single HTML entry point, with script/link tags injected
├── favicon.ico             # Application favicon
├── manifest.webmanifest    # PWA manifest file
└── sw.js                   # The generated service worker
```

- **Hashed Filenames (`-*`):** All JS and CSS assets have a content hash in their filenames (e.g., `index-a1b2c3d4.js`). This is a critical feature for caching. When you deploy a new version, only the files that have changed will get a new hash. This allows browsers to cache the assets indefinitely. When you deploy an update, the `index.html` file will reference the new hashed filenames, forcing the browser to download only the updated chunks.
- **`index.html`**: This is the only file a user's browser ever directly requests. Vite automatically injects the correct `<script>` and `<link>` tags pointing to the hashed asset files.

---

## 3. Deployment Strategy

The contents of the `dist/` directory are entirely static. This means they can be deployed to any static hosting provider.

### Deployment Process

1.  **Run the Build Pipeline**: Execute `bun run build` in a CI/CD environment.
2.  **Deploy the `dist/` Directory**: Copy the contents of the `dist/` directory to the hosting provider.
    - **Common Providers**: Vercel, Netlify, AWS S3, GitHub Pages, etc.
3.  **Configure the Server**: The hosting server must be configured to handle client-side routing. Any request to a path that is not a static file (e.g., `/dashboard`, `/workflow`) must be rewritten to serve the `index.html` file. This allows React Router to take control of the routing on the client side. This is often called a "single-page application (SPA) fallback" or "history API fallback".

### Caching Considerations

- The server should be configured to serve `index.html` with a `cache-control: no-cache` header. This ensures that users always get the latest version of the HTML file, which points to the latest assets.
- All other assets in the `assets/` directory (with their hashed filenames) can be served with a `cache-control: public, max-age=31536000, immutable` header. This tells the browser to cache these files for one year and to never revalidate them, as their content will never change for a given URL.

## Conclusion

The build and deployment pipeline for DIGIT Viz is a modern, automated, and highly optimized process. It guarantees code quality through mandatory type-checking, produces small and efficient bundles through Vite's advanced optimization techniques, and leverages best practices for caching and deployment. This robust pipeline ensures that every deployment is reliable, performant, and secure.
