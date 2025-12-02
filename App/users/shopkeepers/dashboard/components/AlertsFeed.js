import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DASHBOARD_CONSTANTS } from '../constants';

const AlertsFeed = ({ alerts }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const slideAnims = useRef(
    alerts.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (isExpanded) {
      // Start from visible state with subtle entrance animation
      slideAnims.forEach((anim, index) => {
        anim.setValue(-3);
        Animated.timing(anim, {
          toValue: 0,
          duration: 150,
          delay: index * 25,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [isExpanded, alerts]);

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
            size={18}
            color="#4A90E2"
          />
        </TouchableOpacity>
      </View>
      {isExpanded && (
        <View style={styles.alertsList}>
          {alerts.map((alert, index) => {
            const alertStyle = getAlertStyle(alert.type);
            return (
              <Animated.View
                key={alert.id}
                style={[
                  styles.alertWrapper,
                  {
                    transform: [{ translateY: slideAnims[index] }],
                  }
                ]}
              >
                <LinearGradient
                  colors={[alertStyle.color, '#FFFFFF']}
                  style={[
                    styles.alertCard,
                    {
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
                </LinearGradient>
              </Animated.View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  alertsList: {
    gap: 8,
  },
  alertWrapper: {
    flex: 1,
  },
  alertCard: {
    borderRadius: 10,
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
    fontWeight: '700',
    marginBottom: 2,
  },
  alertMessage: {
    fontSize: 12,
    marginBottom: 4,
  },
  alertTime: {
    fontSize: 11,
    opacity: 0.8,
  },
});

export default AlertsFeed;