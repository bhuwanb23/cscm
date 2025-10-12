import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ALERT_TYPES } from '../constants';

const AlertItem = ({ alert, onPress }) => {
  const getAlertIcon = (type) => {
    switch (type) {
      case ALERT_TYPES.CRITICAL:
        return 'warning';
      case ALERT_TYPES.MODERATE:
        return 'car';
      case ALERT_TYPES.SUGGESTION:
        return 'bulb';
      default:
        return 'information-circle';
    }
  };

  const getAlertColor = (color) => {
    switch (color) {
      case 'danger':
        return COLORS.danger;
      case 'warning':
        return COLORS.warning;
      case 'info':
        return COLORS.info;
      default:
        return COLORS.gray[500];
    }
  };

  const getBackgroundColor = (color) => {
    switch (color) {
      case 'danger':
        return COLORS.gray[50];
      case 'warning':
        return '#fefce8';
      case 'info':
        return '#eff6ff';
      default:
        return COLORS.gray[50];
    }
  };

  return (
    <TouchableOpacity 
      style={[
        styles.alertCard,
        { backgroundColor: getBackgroundColor(alert.color) }
      ]}
      onPress={() => onPress(alert)}
    >
      <View style={styles.alertContent}>
        <View style={styles.alertIcon}>
          <Ionicons 
            name={getAlertIcon(alert.type)} 
            size={20} 
            color={getAlertColor(alert.color)} 
          />
        </View>
        
        <View style={styles.alertDetails}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertMessage}>{alert.message}</Text>
          
          <View style={styles.alertFooter}>
            <Text style={[styles.alertPriority, { color: getAlertColor(alert.color) }]}>
              {alert.priority}
            </Text>
            <Text style={styles.alertTime}>{alert.time}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const AlertsSection = ({ alerts, onAlertPress, onViewAllPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Priority Alerts</Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.alertsList}>
        {alerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            onPress={onAlertPress}
          />
        ))}
      </View>
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
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[900],
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  alertsList: {
    gap: 12,
  },
  alertCard: {
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.danger,
  },
  alertContent: {
    flexDirection: 'row',
    gap: 12,
  },
  alertIcon: {
    flexShrink: 0,
  },
  alertDetails: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray[900],
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 12,
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertPriority: {
    fontSize: 12,
    fontWeight: '500',
  },
  alertTime: {
    fontSize: 12,
    color: COLORS.gray[500],
  },
});

export default AlertsSection;
