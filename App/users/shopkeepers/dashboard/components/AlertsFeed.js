import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DASHBOARD_CONSTANTS } from '../constants';

const AlertsFeed = ({ alerts }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getAlertStyle = (type) => {
    switch (type) {
      case 'critical':
        return DASHBOARD_CONSTANTS.ALERT_TYPES.CRITICAL;
      case 'warning':
        return DASHBOARD_CONSTANTS.ALERT_TYPES.WARNING;
      case 'success':
        return DASHBOARD_CONSTANTS.ALERT_TYPES.SUCCESS;
      default:
        return DASHBOARD_CONSTANTS.ALERT_TYPES.WARNING;
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'critical':
        return 'warning';
      case 'warning':
        return 'time';
      case 'success':
        return 'checkmark-circle';
      default:
        return 'information-circle';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Alerts</Text>
        <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)}>
          <Ionicons
            name={isExpanded ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color="#4A90E2"
          />
        </TouchableOpacity>
      </View>
      {isExpanded && (
        <View style={styles.alertsList}>
          {alerts.map((alert) => {
            const alertStyle = getAlertStyle(alert.type);
            return (
              <View
                key={alert.id}
                style={[
                  styles.alertCard,
                  {
                    backgroundColor: alertStyle.color,
                    borderLeftColor: alertStyle.borderColor,
                  },
                ]}
              >
                <View style={styles.alertContent}>
                  <Ionicons
                    name={getAlertIcon(alert.type)}
                    size={16}
                    color={alertStyle.iconColor}
                    style={styles.alertIcon}
                  />
                  <View style={styles.alertText}>
                    <Text style={[styles.alertTitle, { color: alertStyle.borderColor }]}>
                      {alert.title}
                    </Text>
                    <Text style={[styles.alertMessage, { color: alertStyle.borderColor }]}>
                      {alert.message}
                    </Text>
                    <Text style={[styles.alertTime, { color: alertStyle.borderColor }]}>
                      {alert.time}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 12,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 12,
    opacity: 0.8,
  },
});

export default AlertsFeed;
