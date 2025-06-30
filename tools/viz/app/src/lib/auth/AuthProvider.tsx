import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// OAuth Configuration
const AUTH_CONFIG = {
  API_BASE: '/api',
  LOGIN_URL: '/api/user/oauth/token',
  TENANT_ID: 'dj',
  USER_TYPE: 'EMPLOYEE',
  CLIENT_AUTH: 'Basic ZWdvdi11c2VyLWNsaWVudDo='
};

interface User {
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

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (username: string, otp: string) => Promise<void>;
  logout: () => void;
  makeApiCall: (endpoint: string, data?: unknown) => Promise<unknown>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem('egov_token');
    const storedUser = localStorage.getItem('egov_userInfo');
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('egov_token');
        localStorage.removeItem('egov_userInfo');
      }
    }
  }, []);

  const login = async (username: string, otp: string) => {
    const loginPayload = {
      username,
      password: otp,
      grant_type: 'password',
      scope: 'read',
      tenantId: AUTH_CONFIG.TENANT_ID,
      userType: AUTH_CONFIG.USER_TYPE
    };

    const response = await fetch(AUTH_CONFIG.LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': AUTH_CONFIG.CLIENT_AUTH
      },
      body: new URLSearchParams(loginPayload)
    });

    if (!response.ok) {
      throw new Error('Login failed. Please check your credentials.');
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const userInfo = data.UserRequest;

    // Store in state
    setToken(accessToken);
    setUser(userInfo);
    setIsAuthenticated(true);

    // Store in localStorage for persistence
    localStorage.setItem('egov_token', accessToken);
    localStorage.setItem('egov_userInfo', JSON.stringify(userInfo));
  };

  const logout = () => {
    // Clear state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // Clear localStorage
    localStorage.removeItem('egov_token');
    localStorage.removeItem('egov_userInfo');
  };

  const makeApiCall = async (endpoint: string, data?: unknown) => {
    if (!token) {
      throw new Error('Not authenticated. Please login.');
    }

    const response = await fetch(AUTH_CONFIG.API_BASE + endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*'
      },
      body: JSON.stringify({
        ...(data && typeof data === 'object' ? data : {}),
        RequestInfo: {
          apiId: "Rainmaker",
          authToken: token,
          userInfo: user
        }
      })
    });

    if (response.status === 401 || response.status === 403) {
      logout();
      throw new Error('Session expired. Please login again.');
    }

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    login,
    logout,
    makeApiCall
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 