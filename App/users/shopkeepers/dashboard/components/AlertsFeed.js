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
  const fadeAnims = useRef(
    alerts.map(() => new Animated.Value(0))
  ).current;
  const slideAnims = useRef(
    alerts.map(() => new Animated.Value(20))
  ).current;

  useEffect(() => {
    if (isExpanded) {
      const animations = alerts.map((_, index) => [
        Animated.timing(fadeAnims[index], {
          toValue: 1,
          duration: 400,
          delay: index * 80,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnims[index], {
          toValue: 0,
          duration: 400,
          delay: index * 80,
          useNativeDriver: true,
        }),
      ]).flat();

      Animated.parallel(animations).start();
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
            size={16}
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
                    opacity: fadeAnims[index],
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
                      size={14}
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  alertsList: {
    gap: 6,
  },
  alertWrapper: {
    flex: 1,
  },
  alertCard: {
    borderRadius: 8,
    borderLeftWidth: 3,
    padding: 8,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIcon: {
    marginTop: 1,
    marginRight: 6,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 1,
  },
  alertMessage: {
    fontSize: 10,
    marginBottom: 2,
  },
  alertTime: {
    fontSize: 9,
    opacity: 0.8,
  },
});

export default AlertsFeed;
