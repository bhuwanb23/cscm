import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { parsePrice } from '../../../../src/utils/parsePrice';
import { BUSINESS_INFO, CHANNELS, WAREHOUSES, STATS, SHOP_INFO } from '../constants/profileConstants';
import { SHOP_ID } from '../../../../src/constants/storeIds';

function deriveStats(orders, activeShipments) {
  const monthlyOrders = Array.isArray(orders) ? orders.length : 0;
  const monthlyRevenue = Array.isArray(orders)
    ? orders.reduce((sum, o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        const direct = typeof o.total_amount === 'number' ? o.total_amount : 0;
        const fromItems = items.reduce((s, it) => s + (Number(it.quantity || 0) * parsePrice(it.price)), 0);
        return sum + (direct || fromItems);
      }, 0)
    : 0;
  return {
    ...STATS,
    monthlyOrders,
    monthlyRevenue: `$${monthlyRevenue.toFixed(2)}`,
    activeShipments: Array.isArray(activeShipments) ? activeShipments.length : STATS.activeShipments,
  };
}

export const useProfileData = () => {
  const [businessInfo, setBusinessInfo] = useState(BUSINESS_INFO);
  const [channels] = useState(CHANNELS);
  const [warehouses] = useState(WAREHOUSES);
  const [shopInfo] = useState(SHOP_INFO);
  const [loading, setLoading] = useState(false);

  const ordersQuery = useApiQuery('ORDERS_CRUD', 'listByStore', { params: { storeId: SHOP_ID } });
  const shipmentsQuery = useApiQuery('SHIPMENTS', 'listByStatus', { params: { status: 'in_transit' } });

  const stats = useMemo(
    () => deriveStats(ordersQuery.data, shipmentsQuery.data),
    [ordersQuery.data, shipmentsQuery.data]
  );

  const updateBusinessInfo = useCallback((newInfo) => setBusinessInfo(newInfo), []);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([ordersQuery.refetch(), shipmentsQuery.refetch()]);
    } catch {
      // ignore - keep cached data
    } finally {
      setLoading(false);
    }
  }, [ordersQuery, shipmentsQuery]);

  useEffect(() => { refreshData(); }, [refreshData]);

  return {
    businessInfo,
    channels,
    warehouses,
    stats,
    shopInfo,
    loading: loading || ordersQuery.loading || shipmentsQuery.loading,
    error: ordersQuery.error || shipmentsQuery.error,
    updateBusinessInfo,
    refreshData,
  };
};
