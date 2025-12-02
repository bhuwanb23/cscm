import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DASHBOARD_CONSTANTS } from '../constants';

const PendingShipments = ({ shipments }) => {
  const slideAnims = useRef(
    shipments.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Start from visible state with subtle entrance animation
    slideAnims.forEach((anim, index) => {
      anim.setValue(-3);
      Animated.timing(anim, {
        toValue: 0,
        duration: 120,
        delay: index * 20,
        useNativeDriver: true,
      }).start();
    });
  }, [shipments]);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'In Transit':
        return DASHBOARD_CONSTANTS.SHIPMENT_STATUS.IN_TRANSIT;
      case 'Preparing':
        return DASHBOARD_CONSTANTS.SHIPMENT_STATUS.PREPARING;
      default:
        return DASHBOARD_CONSTANTS.SHIPMENT_STATUS.IN_TRANSIT;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Shipments</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.shipmentsList}>
        {shipments.map((shipment, index) => {
          const statusStyle = getStatusStyle(shipment.status);
          return (
            <Animated.View
              key={shipment.id}
              style={[
                styles.shipmentWrapper,
                {
                  transform: [{ translateY: slideAnims[index] }],
                }
              ]}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8FAFC']}
                style={styles.shipmentCard}
              >
                <View style={styles.shipmentHeader}>
                  <Text style={styles.shipmentId}>#{shipment.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.color }]}>
                    <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
                      {shipment.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.shipmentItems}>{shipment.items}</Text>
                <Text style={styles.shipmentEta}>ETA: {shipment.eta}</Text>
              </LinearGradient>
            </Animated.View>
          );
        })}
      </View>
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
  viewAll: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  shipmentsList: {
    gap: 12,
  },
  shipmentWrapper: {
    flex: 1,
  },
  shipmentCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  shipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shipmentId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  shipmentItems: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  shipmentEta: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default PendingShipments;