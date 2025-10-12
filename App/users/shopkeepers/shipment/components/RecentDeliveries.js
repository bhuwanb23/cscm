import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RecentDeliveries = ({ deliveries }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recent Deliveries</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.deliveriesList}>
        {deliveries.map((delivery) => (
          <View key={delivery.id} style={styles.deliveryItem}>
            <View style={styles.deliveryIcon}>
              <Ionicons name="checkmark" size={16} color="#10B981" />
            </View>
            <View style={styles.deliveryInfo}>
              <Text style={styles.deliveryId}>#{delivery.id}</Text>
              <Text style={styles.deliveryTime}>{delivery.deliveredAt}</Text>
            </View>
            <Text style={styles.itemCount}>{delivery.itemCount}</Text>
          </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
  deliveriesList: {
    gap: 12,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  deliveryIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#D1FAE5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  deliveryTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  itemCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default RecentDeliveries;
