import { useCallback, useState } from 'react';
import {
  WHOLESALER_DEFAULT_BUSINESS as DEFAULT_BUSINESS,
  WHOLESALER_DEFAULT_PROFILE_STATS as DEFAULT_STATS,
} from '../../../../src/demo';

const WHOLESALER_ID = 'WHOLE-001';

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
