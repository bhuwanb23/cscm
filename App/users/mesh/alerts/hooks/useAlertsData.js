import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPost } from '../../../../src/api/apiClient';
import { MESH_DEFAULT_ALERTS as DEFAULT_ALERTS } from '../../../../src/demo';

const SEVERITY_META = {
  critical: { bg: '#FEE2E2', fg: '#B91C1C', icon: 'alert-circle' },
  high: { bg: '#FFEDD5', fg: '#9A3412', icon: 'warning' },
  medium: { bg: '#FEF3C7', fg: '#92400E', icon: 'alert' },
  warning: { bg: '#FEF3C7', fg: '#92400E', icon: 'warning' },
  low: { bg: '#DBEAFE', fg: '#1E40AF', icon: 'information-circle' },
  info: { bg: '#DBEAFE', fg: '#1E40AF', icon: 'information-circle' },
};

function normalizeAlert(raw, index) {
  const severity = (raw.severity || 'info').toLowerCase();
  return {
    id: raw.alert_id || raw.id || `A-${1000 + index}`,
    severity,
    title: raw.title || raw.message || 'Mesh alert',
    source: raw.source || raw.origin || 'central-planner',
    description: raw.description || raw.details || raw.message || '',
    created_at: raw.created_at || raw.timestamp || raw.time || '',
    acknowledged: Boolean(raw.acknowledged || raw.acknowledged_at),
  };
}

export const useAlertsData = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const alerts = useApiQuery('CENTRAL_PLANNER', 'anomalyAlertList', { params: { limit: 50 } });

  const allAlerts = useMemo(() => {
    if (alerts.data) {
      const raw = Array.isArray(alerts.data) ? alerts.data
        : Array.isArray(alerts.data.alerts) ? alerts.data.alerts
        : Array.isArray(alerts.data.anomalies) ? alerts.data.anomalies
        : null;
      if (raw && raw.length > 0) return raw.map((a, i) => normalizeAlert(a, i));
    }
    return DEFAULT_ALERTS;
  }, [alerts.data]);

  const counts = useMemo(() => ({
    all: allAlerts.length,
    critical: allAlerts.filter(a => a.severity === 'critical').length,
    high: allAlerts.filter(a => ['high', 'warning'].includes(a.severity)).length,
    unacknowledged: allAlerts.filter(a => !a.acknowledged).length,
  }), [allAlerts]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return allAlerts;
    if (activeFilter === 'unacknowledged') return allAlerts.filter(a => !a.acknowledged);
    if (activeFilter === 'critical') return allAlerts.filter(a => a.severity === 'critical');
    if (activeFilter === 'high') return allAlerts.filter(a => ['high', 'warning'].includes(a.severity));
    return allAlerts;
  }, [allAlerts, activeFilter]);

  const acknowledge = useCallback(async (alertId) => {
    try { await apiPost(`/api/v1/central-planner/alerts/${encodeURIComponent(alertId)}/acknowledge`, { body: {} }); alerts.refetch(); } catch {}
  }, [alerts]);

  return {
    alerts: filtered,
    counts,
    activeFilter,
    setActiveFilter,
    acknowledge,
    severityMeta: SEVERITY_META,
    loading: alerts.loading,
    error: alerts.error,
    refetch: alerts.refetch,
  };
};
