import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, ALERT_TYPES } from '../constants';

const AlertItem = ({ alert, onPress, index }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
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

  const getAlertGradient = (color) => {
    switch (color) {
      case 'danger':
        return ['#FEF2F2', '#FECACA'];
      case 'warning':
        return ['#FFFBEB', '#FED7AA'];
      case 'info':
        return ['#EFF6FF', '#DBEAFE'];
      default:
        return ['#F9FAFB', '#F3F4F6'];
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
    <Animated.View
      style={[
        styles.alertWrapper,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.alertCard}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={getAlertGradient(alert.color)}
          style={styles.alertGradient}
        >
          <View style={styles.alertContent}>
            <LinearGradient
              colors={[getAlertColor(alert.color), `${getAlertColor(alert.color)}CC`]}
              style={styles.alertIcon}
            >
              <Ionicons 
                name={getAlertIcon(alert.type)} 
                size={16} 
                color="#FFFFFF" 
              />
            </LinearGradient>
            
            <View style={styles.alertDetails}>
              <Text style={styles.alertTitle} numberOfLines={1}>{alert.title}</Text>
              <Text style={styles.alertMessage} numberOfLines={2}>{alert.message}</Text>
              
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
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AlertsSection = ({ alerts, onAlertPress, onViewAllPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          }],
        }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.gradientContainer}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.sectionTitle}>Priority Alerts</Text>
          </View>
          <TouchableOpacity onPress={onViewAllPress} style={styles.viewAllButton}>
            <LinearGradient
              colors={['#3B82F6', '#1E40AF']}
              style={styles.viewAllGradient}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
            </LinearGradient>
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
      </LinearGradient>
    </Animated.View>
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
