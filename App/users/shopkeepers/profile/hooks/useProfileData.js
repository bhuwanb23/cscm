import { useState, useEffect } from 'react';
import { BUSINESS_INFO, CHANNELS, WAREHOUSES, STATS, SHOP_INFO } from '../constants/profileConstants';

export const useProfileData = () => {
  const [businessInfo, setBusinessInfo] = useState(BUSINESS_INFO);
  const [channels] = useState(CHANNELS);
  const [warehouses] = useState(WAREHOUSES);
  const [stats] = useState(STATS);
  const [shopInfo] = useState(SHOP_INFO);
  const [loading, setLoading] = useState(false);

  const updateBusinessInfo = (newInfo) => {
    setBusinessInfo(newInfo);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // In a real app, you would fetch fresh data from an API here
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  return {
    businessInfo,
    channels,
    warehouses,
    stats,
    shopInfo,
    loading,
    updateBusinessInfo,
    refreshData
  };
};