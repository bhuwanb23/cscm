import { useState, useEffect } from 'react';
import { DEFAULT_USER_DATA, RECENT_ACTIVITY } from '../constants/profileConstants';

/**
 * Custom hook to manage profile data
 */
export const useProfileData = () => {
  const [userData, setUserData] = useState(DEFAULT_USER_DATA);
  const [recentActivity, setRecentActivity] = useState(RECENT_ACTIVITY);
  const [loading, setLoading] = useState(false);

  // In a real app, this would fetch data from an API
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real implementation, you would fetch actual data here
      // const response = await fetch('/api/profile');
      // const data = await response.json();
      // setUserData(data);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  return {
    userData,
    recentActivity,
    loading,
    refreshData: fetchProfileData,
  };
};