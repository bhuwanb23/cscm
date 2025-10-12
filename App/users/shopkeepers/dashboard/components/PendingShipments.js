import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { DASHBOARD_CONSTANTS } from '../constants';

const PendingShipments = ({ shipments }) => {
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
        {shipments.map((shipment) => {
          const statusStyle = getStatusStyle(shipment.status);
          return (
            <View key={shipment.id} style={styles.shipmentCard}>
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
            </View>
          );
        })}
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
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewAll: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  shipmentsList: {
    gap: 12,
  },
  shipmentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  shipmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  shipmentId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  shipmentItems: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  shipmentEta: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default PendingShipments;
