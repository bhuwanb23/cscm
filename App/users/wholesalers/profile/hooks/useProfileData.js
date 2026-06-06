import { useCallback, useState } from 'react';

const WHOLESALER_ID = 'WHOLE-001';

const DEFAULT_BUSINESS = {
  businessName: 'CSCM Wholesale Distribution',
  contactPerson: 'Rajesh Kumar',
  email: 'rajesh@cscm-wholesale.com',
  phone: '+91 98765 43210',
  gstin: 'GSTIN-22AAAAA0000A1Z5',
  address: 'Plot 45, Industrial Area Phase 2, Bangalore 560058',
  pan: 'AAACM1234N',
  yearsInBusiness: 12,
};

const DEFAULT_STATS = {
  totalRetailers: 84,
  monthlyOrders: 312,
  fulfillmentRate: 94,
  avgDeliveryTime: '2.4 hrs',
};

export const useProfileData = () => {
  const [business, setBusiness] = useState(DEFAULT_BUSINESS);
  const [stats] = useState(DEFAULT_STATS);

  const updateBusiness = useCallback((patch) => setBusiness(prev => ({ ...prev, ...patch })), []);

  return {
    business,
    stats,
    updateBusiness,
    wholesalerId: WHOLESALER_ID,
  };
};
