import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import {
  TRANSPORTER_DEFAULT_DRIVER as DEFAULT_DRIVER,
  TRANSPORTER_DEFAULT_VEHICLE as DEFAULT_VEHICLE,
  TRANSPORTER_DEFAULT_STATS as DEFAULT_STATS,
} from '../../../../src/demo';

const TRANSPORTER_ID = 'TRANS-001';

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
