import { useState, useEffect, type ReactNode } from 'react';
import { LoginPage } from './LoginPage';
import { type User, type AuthContextType, AuthContext, AUTH_CONFIG } from './auth';
import { setGlobalLogoutCallback, apiClient, getCurrentTargetUrl } from '@/lib/api/apiClient';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const logout = () => {
    // Clear state
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);

    // Clear localStorage
    localStorage.removeItem('egov_token');
    localStorage.removeItem('egov_userInfo');
  };

  useEffect(() => {
    // Register logout callback with API client
    setGlobalLogoutCallback(logout);

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
        'Authorization': AUTH_CONFIG.CLIENT_AUTH,
        'X-Target-URL': getCurrentTargetUrl() // Ensure login goes to selected environment
      },
      body: new URLSearchParams(loginPayload)
    });

    if (!response.ok) {
      throw new Error('Login failed. Please check your credentials.');
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const userInfo = data.UserRequest;

    // Debug logging
    console.group('🔐 LOGIN DEBUG INFO');
    console.log('Full response data:', data);
    console.log('UserRequest object:', userInfo);
    console.log('User roles:', userInfo?.roles);
    console.log('User role type:', typeof userInfo?.roles);
    console.log('First role:', userInfo?.roles?.[0]);
    console.log('Access token:', accessToken ? 'EXISTS' : 'MISSING');
    console.groupEnd();

    // Store in state
    setToken(accessToken);
    setUser(userInfo);
    setIsAuthenticated(true);

    // Store in localStorage for persistence
    localStorage.setItem('egov_token', accessToken);
    localStorage.setItem('egov_userInfo', JSON.stringify(userInfo));
  };

  const makeApiCall = async (endpoint: string, data?: unknown) => {
    const response = await apiClient.authenticated(AUTH_CONFIG.API_BASE + endpoint, data);
    return response.data;
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