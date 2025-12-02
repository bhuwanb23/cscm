import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ALERT_TYPES } from '../constants';

const AlertItem = ({ alert, onPress, index }) => {
  const handlePress = () => {
    onPress(alert);
  };

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

  const getAlertBackgroundColor = (color) => {
    switch (color) {
      case 'danger':
        return '#FEF2F2';
      case 'warning':
        return '#FFFBEB';
      case 'info':
        return '#EFF6FF';
      default:
        return '#F9FAFB';
    }
  };

  const getAlertColor = (color) => {
    switch (color) {
      case 'danger':
        return '#EF4444';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={styles.alertWrapper}>
      <TouchableOpacity 
        style={styles.alertCard}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={[styles.alertGradient, { backgroundColor: getAlertBackgroundColor(alert.color) }]}>
          <View style={styles.alertContent}>
            <View 
              style={[styles.alertIcon, { backgroundColor: getAlertColor(alert.color) }]}
            >
              <Ionicons 
                name={getAlertIcon(alert.type)} 
                size={16} 
                color="#FFFFFF" 
              />
            </View>
            
            <View style={styles.alertDetails}>
              <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
              <Text style={styles.alertMessage} numberOfLines={3}>{alert.message}</Text>
              
              {/* Detailed information */}
              <View style={styles.detailsContainer}>
                {alert.details && Object.keys(alert.details).map((key, idx) => (
                  <View key={idx} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</Text>
                    <Text style={styles.detailValue}>{alert.details[key]}</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.alertFooter}>
                <View style={[styles.priorityBadge, { backgroundColor: `${getAlertColor(alert.color)}20` }]}>
                  <Text style={[styles.alertPriority, { color: getAlertColor(alert.color) }]}>
                    {alert.priority}
                  </Text>
                </View>
                <Text style={styles.alertTime}>{alert.time}</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const AlertsSection = ({ alerts, onAlertPress, onViewAllPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.sectionTitle}>Priority Alerts</Text>
          </View>
          <TouchableOpacity onPress={onViewAllPress} style={styles.viewAllButton}>
            <View style={styles.viewAllGradient}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.alertsList}>
          {alerts.map((alert, index) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onPress={onAlertPress}
              index={index}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  gradientContainer: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  viewAllButton: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  viewAllGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
    backgroundColor: '#3B82F6',
  },
  viewAllText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  alertsList: {
    gap: 6,
  },
  alertWrapper: {
    marginBottom: 2,
  },
  alertCard: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  alertGradient: {
    padding: 10,
  },
  alertContent: {
    flexDirection: 'row',
    gap: 10,
  },
  alertIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertDetails: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 6,
    lineHeight: 14,
  },
  detailsContainer: {
    marginBottom: 6,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  detailKey: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 4,
  },
  detailValue: {
    fontSize: 9,
    color: '#4B5563',
    flex: 1,
  },
  alertFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alertPriority: {
    fontSize: 9,
    fontWeight: '600',
  },
  alertTime: {
    fontSize: 9,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default AlertsSection;