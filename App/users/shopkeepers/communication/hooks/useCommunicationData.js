import { useState, useEffect } from 'react';
import { COMMUNICATION_CONSTANTS } from '../constants';

export const useCommunicationData = () => {
  const [quickStats, setQuickStats] = useState(COMMUNICATION_CONSTANTS.QUICK_STATS);
  const [alerts, setAlerts] = useState(COMMUNICATION_CONSTANTS.ALERTS);
  const [messages, setMessages] = useState(COMMUNICATION_CONSTANTS.MESSAGES);
  const [quickHelp, setQuickHelp] = useState(COMMUNICATION_CONSTANTS.QUICK_HELP);
  const [loading, setLoading] = useState(false);

  // Simulate data refresh
  const refreshData = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  // Mark alert as read
  const markAlertAsRead = (alertId) => {
    setAlerts(prevAlerts => 
      prevAlerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, read: true }
          : alert
      )
    );
  };

  // Mark message as read
  const markMessageAsRead = (messageId) => {
    setMessages(prevMessages =>
      prevMessages.map(message =>
        message.id === messageId
          ? { ...message, unreadCount: 0 }
          : message
      )
    );
  };

  // Get unread count
  const getUnreadCount = () => {
    return messages.reduce((total, message) => total + message.unreadCount, 0);
  };

  // Get active alerts count
  const getActiveAlertsCount = () => {
    return alerts.filter(alert => !alert.read).length;
  };

  return {
    quickStats,
    alerts,
    messages,
    quickHelp,
    loading,
    refreshData,
    markAlertAsRead,
    markMessageAsRead,
    getUnreadCount,
    getActiveAlertsCount
  };
};
