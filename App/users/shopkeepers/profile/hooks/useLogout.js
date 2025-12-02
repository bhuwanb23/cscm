import { useCallback } from 'react';

/**
 * Custom hook to handle logout functionality
 */
export const useLogout = (onLogoutCallback) => {
  const handleLogout = useCallback(() => {
    // Perform any cleanup or analytics tracking here
    console.log('User logging out...');
    
    // In a real app, you might want to:
    // 1. Clear user data from storage
    // 2. Revoke tokens
    // 3. Reset application state
    
    // Call the provided callback
    if (onLogoutCallback && typeof onLogoutCallback === 'function') {
      onLogoutCallback();
    }
  }, [onLogoutCallback]);

  return {
    handleLogout,
  };
};