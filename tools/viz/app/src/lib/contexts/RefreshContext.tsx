import React, { createContext, useContext, useState, useRef, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';

interface RefreshContextType {
  triggerRefresh: () => void;
  isRefreshing: boolean;
  setRefreshHandler: (handler?: () => void) => void;
  setRefreshingState: (isRefreshing: boolean) => void;
}

const RefreshContext = createContext<RefreshContextType | undefined>(undefined);

export const useRefresh = () => {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error('useRefresh must be used within a RefreshProvider');
  }
  return context;
};

interface RefreshProviderProps {
  children: ReactNode;
}

export const RefreshProvider: React.FC<RefreshProviderProps> = ({ children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshHandlerRef = useRef<(() => void) | undefined>(undefined);

  const setRefreshHandler = useCallback((handler?: () => void) => {
    refreshHandlerRef.current = handler;
  }, []);

  const setRefreshingState = useCallback((refreshing: boolean) => {
    setIsRefreshing(refreshing);
  }, []);

  const triggerRefresh = useCallback(() => {
    if (refreshHandlerRef.current) {
      refreshHandlerRef.current();
    }
  }, []);

  const contextValue = useMemo(() => ({
    triggerRefresh,
    isRefreshing,
    setRefreshHandler,
    setRefreshingState,
  }), [triggerRefresh, isRefreshing, setRefreshHandler, setRefreshingState]);

  return (
    <RefreshContext.Provider value={contextValue}>
      {children}
    </RefreshContext.Provider>
  );
}; 