import { useCallback, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPost } from '../../../../src/api/apiClient';
import { MESH_DEFAULT_DRIFT as DEFAULT_DRIFT } from '../../../../src/demo';

export const useDriftData = () => {
  const [history, setHistory] = useState([
    { time: '00:00', score: 0.02 },
    { time: '02:00', score: 0.03 },
    { time: '04:00', score: 0.04 },
    { time: '06:00', score: 0.05 },
    { time: '08:00', score: 0.07 },
    { time: '10:00', score: 0.13 },
  ]);
  const drift = useApiQuery('CENTRAL_PLANNER', 'driftDetectorCheck', { params: { model: 'DemandForecaster' }, skip: true });

  const snapshot = drift.data || DEFAULT_DRIFT;
  const isCritical = snapshot.drift_score >= snapshot.threshold;

  const triggerRetrain = useCallback(async () => {
    try { await apiPost('/api/v1/central-planner/retrain', { body: { model: snapshot.model } }); } catch {}
  }, [snapshot.model]);

  return {
    snapshot,
    history,
    isCritical,
    triggerRetrain,
    loading: drift.loading,
    error: drift.error,
    refetch: drift.refetch,
  };
};
