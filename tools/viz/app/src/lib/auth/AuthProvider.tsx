import { useState, useEffect, type ReactNode } from 'react';
import { LoginPage } from './LoginPage';
import { type User, type AuthContextType, AuthContext, AUTH_CONFIG } from './auth';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(false);
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

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper spinner component
  }

  return (
    <AuthContext.Provider value={value}>
      {isAuthenticated ? children : <LoginPage />}
    </AuthContext.Provider>
  );
} 