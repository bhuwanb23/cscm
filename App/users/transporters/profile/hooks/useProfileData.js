import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';

const TRANSPORTER_ID = 'TRANS-001';

const DEFAULT_DRIVER = {
  name: 'John Smith',
  driverId: 'DRV001',
  email: 'john.smith@transporter.com',
  licenseNumber: 'DL1234567890',
  licenseExpiry: '2025-12-31',
  phone: '+1 (555) 123-4567',
  emergencyContact: '+1 (555) 987-6543',
  experience: 5,
  preferredRoutes: 'City Center, Downtown',
};

const DEFAULT_VEHICLE = {
  type: 'Delivery Van',
  registration: 'ABC-123-XYZ',
  capacity: '1.5 tons',
  lastService: '2024-09-15',
  nextService: '2025-03-15',
  insuranceExpiry: '2025-06-30',
};

const DEFAULT_STATS = { completedDeliveries: 127, onTimeRate: 96, rating: 4.8 };

function deriveStats(delivered) {
  if (!Array.isArray(delivered) || delivered.length === 0) return DEFAULT_STATS;
  return {
    completedDeliveries: delivered.length || DEFAULT_STATS.completedDeliveries,
    onTimeRate: DEFAULT_STATS.onTimeRate,
    rating: DEFAULT_STATS.rating,
  };
}

export const useProfileData = () => {
  const [driverInfo, setDriverInfo] = useState(DEFAULT_DRIVER);
  const [vehicleInfo, setVehicleInfo] = useState(DEFAULT_VEHICLE);
  const [loading, setLoading] = useState(false);

  const delivered = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'delivered' } });

  const stats = useMemo(() => deriveStats(delivered.data), [delivered.data]);

  const updateDriverInfo = useCallback((newInfo) => setDriverInfo(prev => ({ ...prev, ...newInfo })), []);
  const updateVehicleInfo = useCallback((newInfo) => setVehicleInfo(prev => ({ ...prev, ...newInfo })), []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try { await delivered.refetch(); } catch {} finally { setLoading(false); }
  }, [delivered]);

  useEffect(() => { refreshData(); }, [refreshData]);

  return {
    driverInfo,
    vehicleInfo,
    stats,
    updateDriverInfo,
    updateVehicleInfo,
    loading: loading || delivered.loading,
    error: delivered.error,
    refreshData,
  };
};
