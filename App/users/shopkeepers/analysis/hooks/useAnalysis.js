import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing } from 'react-native';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPost } from '../../../../src/api/apiClient';
import { ANALYSIS_MODULES } from '../constants';
import {
  SHOPKEEPER_DEFAULT_METRICS as DEFAULT_METRICS,
  SHOPKEEPER_DONE_METRICS as DONE_METRICS,
  SHOPKEEPER_DEFAULT_INSIGHTS as DEFAULT_INSIGHTS,
} from '../../../../src/demo';
import { SHOP_ID } from '../../../../src/constants/storeIds';

function extractInsights(payload) {
  if (!payload) return null;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.recommendations)) return payload.recommendations;
  if (Array.isArray(payload.insights)) return payload.insights;
  if (Array.isArray(payload.actions)) return payload.actions.map(a => a.description || a.summary || JSON.stringify(a));
  return null;
}

export const useAnalysis = () => {
  const [status, setStatus] = useState('idle');
  const [activeTab, setActiveTab] = useState('Inventory Health');
  const [metrics, setMetrics] = useState(DEFAULT_METRICS);
  const [moduleProgress, setModuleProgress] = useState(
    ANALYSIS_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: 0 }), {}),
  );
  const [insights, setInsights] = useState([]);

  const strategic = useApiQuery('STORE', 'strategicUpdate', { params: { storeId: SHOP_ID }, skip: true });
  const runAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (strategic.data) {
      const fromBackend = extractInsights(strategic.data);
      if (fromBackend && fromBackend.length > 0 && insights.length === 0) {
        setInsights(fromBackend.slice(0, 4));
      }
    }
  }, [strategic.data, insights.length]);

  useEffect(() => {
    let animation;
    if (status === 'running') {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(runAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(runAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ]),
      ).start();
    } else {
      runAnim.setValue(0);
    }
    return () => { if (animation) animation.stop(); };
  }, [status, runAnim]);

  const startAnalysis = useCallback(async () => {
    if (status === 'running') return;
    setStatus('running');
    setModuleProgress(ANALYSIS_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: 3 }), {}));
    setInsights([]);

    ANALYSIS_MODULES.forEach((m, index) => {
      setTimeout(() => {
        setModuleProgress(prev => ({ ...prev, [m.id]: 100 }));
      }, 800 * (index + 1));
    });

    setTimeout(() => {
      setMetrics(DONE_METRICS);
      setInsights(DEFAULT_INSIGHTS);
      setStatus('done');
    }, 800 * (ANALYSIS_MODULES.length + 2));

    try {
      const response = await apiPost('/api/v1/store/strategic-update', { body: { store_id: SHOP_ID, scope: 'inventory_health' } });
      const fromBackend = extractInsights(response);
      if (fromBackend && fromBackend.length > 0) {
        setInsights(fromBackend.slice(0, 4));
      }
    } catch {
      // Demo: keep local mock insights on failure
    }
  }, [status]);

  const runScale = runAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });

  return {
    status,
    activeTab,
    metrics,
    moduleProgress,
    insights,
    runScale,
    setActiveTab,
    startAnalysis,
    loading: strategic.loading,
    error: strategic.error,
    refetch: strategic.refetch,
  };
};
