import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { friendsAPI } from '../services/friendsService';
import { useAuth } from './AuthContext';

interface FriendRequestContextType {
  pendingCount: number;
  refreshCount: () => Promise<void>;
}

const FriendRequestContext = createContext<FriendRequestContextType | undefined>(undefined);

export const FriendRequestProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  const refreshCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const requests = await friendsAPI.getPendingRequests();
      setPendingCount(requests.length);
    } catch {
      // silently fail — badge is non-critical
    }
  }, [isAuthenticated]);

  // Fetch on login
  useEffect(() => {
    if (isAuthenticated) {
      refreshCount();
    } else {
      setPendingCount(0);
    }
  }, [isAuthenticated]);

  // Re-fetch when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isAuthenticated) {
        refreshCount();
      }
    });
    return () => sub.remove();
  }, [isAuthenticated, refreshCount]);

  return (
    <FriendRequestContext.Provider value={{ pendingCount, refreshCount }}>
      {children}
    </FriendRequestContext.Provider>
  );
};

export const useFriendRequests = () => {
  const context = useContext(FriendRequestContext);
  if (!context) throw new Error('useFriendRequests must be used within FriendRequestProvider');
  return context;
};
