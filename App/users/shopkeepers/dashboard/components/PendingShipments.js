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
  viewAll: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  shipmentsList: {
    gap: 8,
  },
  shipmentWrapper: {
    flex: 1,
  },
  shipmentCard: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  shipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  shipmentId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  shipmentItems: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  shipmentEta: {
    fontSize: 11,
    color: '#6B7280',
  },
});

export default PendingShipments;
