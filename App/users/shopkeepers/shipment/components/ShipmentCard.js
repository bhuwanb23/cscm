import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ShipmentCard = ({ shipment, onActionPress, getStatusStyle }) => {
  const statusStyle = getStatusStyle(shipment.status);
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getProgressColor = (status) => {
    switch (status) {
      case 'in_transit':
        return ['#2563EB', '#1E40AF'];
      case 'arriving_soon':
        return ['#10B981', '#059669'];
      case 'delayed':
        return ['#F59E0B', '#D97706'];
      case 'out_for_delivery':
        return ['#A855F7', '#9333EA'];
      default:
        return ['#2563EB', '#1E40AF'];
    }
  };

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
    onActionPress(shipment);
  };

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <TouchableOpacity style={styles.touchable} activeOpacity={0.9}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.content}
        >
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.shipmentId}>#{shipment.id}</Text>
              <Text style={styles.shipmentTitle} numberOfLines={1}>{shipment.title}</Text>
            </View>
            <LinearGradient
              colors={[statusStyle.bgColor, `${statusStyle.bgColor}CC`]}
              style={styles.statusBadge}
            >
              <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
                {statusStyle.label}
              </Text>
            </LinearGradient>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressPercentage}>{shipment.progress}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={styles.progressTrack}>
                <LinearGradient
                  colors={getProgressColor(shipment.status)}
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(shipment.progress, 100)}%`,
                    },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ETA</Text>
              <Text style={styles.detailValue}>{shipment.eta}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Transporter</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{shipment.transporter}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <View style={styles.locationContainer}>
              <Ionicons
                name={shipment.icon}
                size={14}
                color={shipment.iconColor}
              />
              <Text style={styles.distanceText}>{shipment.distance}</Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handlePress}
            >
              <LinearGradient
                colors={shipment.actionColor === '#3B82F6' ? ['#3B82F6', '#1E40AF'] : ['#22C55E', '#16A34A']}
                style={styles.actionGradient}
              >
                <Text style={styles.actionText}>
                  {shipment.actionText}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  touchable: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  shipmentId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 1,
  },
  shipmentTitle: {
    fontSize: 11,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  progressContainer: {
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  progressLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '600',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressTrack: {
    width: '100%',
    height: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 1,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distanceText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionGradient: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ShipmentCard;
