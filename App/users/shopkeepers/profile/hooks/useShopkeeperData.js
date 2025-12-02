import { useState, useEffect } from 'react';
import {
  SHOPKEEPER_PROFILE,
  SHOP_INFORMATION,
  PERFORMANCE_METRICS,
  INVENTORY_MESH_STATUS,
  SALES_INSIGHTS,
  COMPLIANCE_RISK,
  TEAM_MEMBERS,
  SETTINGS_INTEGRATIONS
} from '../constants/shopkeeperConstants';

/**
 * Custom hook to manage shopkeeper profile data
 */
export const useShopkeeperData = () => {
  const [shopkeeperProfile, setShopkeeperProfile] = useState(SHOPKEEPER_PROFILE);
  const [shopInformation, setShopInformation] = useState(SHOP_INFORMATION);
  const [performanceMetrics, setPerformanceMetrics] = useState(PERFORMANCE_METRICS);
  const [inventoryMeshStatus, setInventoryMeshStatus] = useState(INVENTORY_MESH_STATUS);
  const [salesInsights, setSalesInsights] = useState(SALES_INSIGHTS);
  const [complianceRisk, setComplianceRisk] = useState(COMPLIANCE_RISK);
  const [teamMembers, setTeamMembers] = useState(TEAM_MEMBERS);
  const [settingsIntegrations, setSettingsIntegrations] = useState(SETTINGS_INTEGRATIONS);
  const [loading, setLoading] = useState(false);

  // In a real app, this would fetch data from an API
  const fetchShopkeeperData = async () => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      // In a real implementation, you would fetch actual data here
    } catch (error) {
      console.error('Error fetching shopkeeper data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshAllData = () => {
    fetchShopkeeperData();
  };

  useEffect(() => {
    fetchShopkeeperData();
  }, []);

  return {
    shopkeeperProfile,
    shopInformation,
    performanceMetrics,
    inventoryMeshStatus,
    salesInsights,
    complianceRisk,
    teamMembers,
    settingsIntegrations,
    loading,
    refreshAllData,
  };
};