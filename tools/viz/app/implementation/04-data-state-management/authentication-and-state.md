# Authentication and State Management (React Context)

## Executive Summary

This document describes the application's core authentication and global state management architecture. The system is built using React's native **Context API** (`createContext`, `useContext`) to manage user authentication state. A central `AuthProvider` component encapsulates all authentication logic, including logging in, logging out, persisting the session to `localStorage`, and providing an authenticated API client.

---

## 1. Architectural Overview

The authentication system is composed of three main parts:

- **`AuthContext` (`src/lib/auth/auth.ts`)**: Defines the "shape" of the authentication data and functions that will be available to the rest of the application.
- **`AuthProvider` (`src/lib/auth/AuthProvider.tsx`)**: A component that wraps the application, manages the actual state (using `useState`), contains all the logic for auth operations, and provides this state to its children via the `AuthContext.Provider`.
- **`useAuth` Hook (`src/lib/auth/auth.ts`)**: A custom hook that provides a convenient way for components to access the authentication context.

---

## 2. The `AuthContext` and `useAuth` Hook

The foundation is the context definition and the consumer hook.

**File Reference**: `1:44:src/lib/auth/auth.ts`

```typescript
import { createContext, useContext } from "react";

// ... User interface ...

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (username: string, otp: string) => Promise<void>;
  logout: () => void;
  makeApiCall: (endpoint: string, data?: unknown) => Promise<unknown>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

### Key Concepts

- **`AuthContextType`**: This interface clearly defines the contract for our authentication state. Any component using the `useAuth` hook will have access to these properties and methods with full type safety.
- **`createContext`**: A new context is created with an initial value of `undefined`.
- **`useAuth` Hook**: This custom hook simplifies consuming the context. It also includes a crucial runtime check to ensure that any component using it is a descendant of `AuthProvider`, throwing an error if it's not. This prevents common bugs.

---

## 3. The `AuthProvider` Component

This is the heart of the system, where all the logic resides.

**File Reference**: `1:134:src/lib/auth/AuthProvider.tsx`

### Core Responsibilities

1.  **State Management**: It uses multiple `useState` hooks to manage the `token`, `user`, `isAuthenticated`, and `isLoading` flags.
2.  **Session Persistence**: It uses a `useEffect` hook to check `localStorage` for a stored session when the application first loads. This rehydrates the state and keeps the user logged in across page reloads.
3.  **Login/Logout Logic**: It contains the `async login` function, which handles the `fetch` request to the OAuth token endpoint, and the `logout` function, which clears the state and `localStorage`.
4.  **Authenticated API Calls**: It provides a `makeApiCall` function that automatically injects the user's `authToken` and `userInfo` into the `RequestInfo` block of every outgoing API request. It also includes logic to automatically log the user out if a 401 or 403 response is received.
5.  **Conditional Rendering**: It wraps its `children` with the `<AuthContext.Provider>`. Crucially, it only renders the main application (`children`) if the user `isAuthenticated`. Otherwise, it renders the `<LoginPage />`, effectively protecting the entire application.

### Usage in `App.tsx`

The `AuthProvider` is used at the top level of the application tree to wrap all other components.

**File Reference**: `1:32:src/App.tsx`

```typescript
function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>{/* ... Routes ... */}</Layout>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}
```

## Conclusion

The application uses a robust, self-contained authentication system based on the standard React Context API. This approach, while more verbose than a dedicated library like Zustand, provides a clear and explicit flow of logic. All authentication concerns are encapsulated within the `AuthProvider`, and the `useAuth` hook offers a clean, type-safe API for consumer components. This pattern is highly effective for managing global authentication state without introducing external dependencies.
