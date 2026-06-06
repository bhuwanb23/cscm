import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { COMMUNICATION_CONSTANTS } from '../constants';

const SEVERITY_META = {
  critical: { color: '#EF4444', bgColor: '#FEE2E2' },
  high: { color: '#F97316', bgColor: '#FFEDD5' },
  medium: { color: '#F59E0B', bgColor: '#FEF3C7' },
  warning: { color: '#F59E0B', bgColor: '#FEF3C7' },
  low: { color: '#3B82F6', bgColor: '#DBEAFE' },
  info: { color: '#3B82F6', bgColor: '#DBEAFE' },
  success: { color: '#10B981', bgColor: '#D1FAE5' },
};

function normalizeAlert(raw, index) {
  const severity = (raw.severity || 'info').toLowerCase();
  const meta = SEVERITY_META[severity] || SEVERITY_META.info;
  return {
    id: raw.alert_id || raw.id || `ALERT-${index}`,
    type: raw.type || raw.category || 'Alert',
    title: raw.title || raw.message || 'Alert',
    description: raw.description || raw.message || '',
    severity,
    color: meta.color,
    bgColor: meta.bgColor,
    read: Boolean(raw.read || raw.acknowledged || raw.acknowledged_at),
    timestamp: raw.timestamp || raw.created_at || raw.time || '',
    source: raw.source || raw.origin || 'system',
  };
}

export const useCommunicationData = () => {
  const alertsQuery = useApiQuery('CENTRAL_PLANNER', 'anomalyAlertList', { params: { limit: 20 } });
  const [localAlerts, setLocalAlerts] = useState([]);
  const [messages, setMessages] = useState(COMMUNICATION_CONSTANTS.MESSAGES);
  const [quickHelp] = useState(COMMUNICATION_CONSTANTS.QUICK_HELP);
  const [loading, setLoading] = useState(false);

  const alerts = useMemo(() => {
    if (alertsQuery.data) {
      const raw = Array.isArray(alertsQuery.data) ? alertsQuery.data
        : Array.isArray(alertsQuery.data.alerts) ? alertsQuery.data.alerts
        : Array.isArray(alertsQuery.data.anomalies) ? alertsQuery.data.anomalies
        : null;
      if (raw && raw.length > 0) return raw.map((r, i) => normalizeAlert(r, i));
    }
    if (localAlerts.length > 0) return localAlerts;
    return COMMUNICATION_CONSTANTS.ALERTS;
  }, [alertsQuery.data, localAlerts]);

  const quickStats = useMemo(() => {
    const unread = messages.reduce((total, m) => total + m.unreadCount, 0);
    const activeAlerts = alerts.filter(a => !a.read).length;
    return {
      ...COMMUNICATION_CONSTANTS.QUICK_STATS,
      UNREAD: unread,
      ALERTS: activeAlerts,
    };
  }, [alerts, messages]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    try {
      await alertsQuery.refetch();
    } catch {
      // ignore - fall through
    }
    setLoading(false);
  }, [alertsQuery]);

  const markAlertAsRead = useCallback((alertId) => {
    setLocalAlerts(prev => {
      const base = prev.length > 0 ? prev : COMMUNICATION_CONSTANTS.ALERTS;
      return base.map(a => a.id === alertId ? { ...a, read: true } : a);
    });
  }, []);

  const markMessageAsRead = useCallback((messageId) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, unreadCount: 0 } : m));
  }, []);

  const getUnreadCount = useCallback(() => messages.reduce((t, m) => t + m.unreadCount, 0), [messages]);
  const getActiveAlertsCount = useCallback(() => alerts.filter(a => !a.read).length, [alerts]);

  return {
    quickStats,
    alerts,
    messages,
    quickHelp,
    loading: loading || alertsQuery.loading,
    refreshData,
    markAlertAsRead,
    markMessageAsRead,
    getUnreadCount,
    getActiveAlertsCount,
  };
};
