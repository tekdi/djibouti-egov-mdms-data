import { createContext, useContext } from "react";

// OAuth Configuration
export const AUTH_CONFIG = {
  API_BASE: "/api",
  LOGIN_URL: "/api/user/oauth/token",
  TENANT_ID: "dj",
  USER_TYPE: "EMPLOYEE",
  CLIENT_AUTH: "Basic ZWdvdi11c2VyLWNsaWVudDo=",
};

export interface User {
  id: string;
  userName: string;
  name: string;
  mobileNumber: string;
  emailId: string;
  roles: Array<{
    name: string;
    code: string;
  }>;
}

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
