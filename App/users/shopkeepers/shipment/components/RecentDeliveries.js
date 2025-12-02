import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RecentDeliveries = ({ deliveries }) => {
  const handleViewAll = () => {
    console.log('View all deliveries pressed');
  };

  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="cube" size={16} color="#3B82F6" />
            <Text style={styles.title}>Recent Deliveries</Text>
          </View>
          <TouchableOpacity onPress={handleViewAll} style={styles.viewAllButton}>
            <View style={styles.viewAllGradient}>
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={12} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.deliveriesList}>
          {deliveries.map((delivery, index) => (
            <View
              key={delivery.id}
              style={styles.deliveryWrapper}
            >
              <View style={styles.deliveryItem}>
                <View style={styles.deliveryIcon}>
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.deliveryInfo}>
                  <Text style={styles.deliveryId}>#{delivery.id}</Text>
                  <Text style={styles.deliveryTitle}>{delivery.title}</Text>
                  <Text style={styles.deliveryTime}>{delivery.deliveredAt}</Text>
                </View>
                <View style={styles.deliveryDetails}>
                  <Text style={styles.itemCount}>{delivery.itemCount}</Text>
                  <Text style={styles.orderValue}>{delivery.orderValue}</Text>
                  <Text style={styles.transporter}>{delivery.transporter}</Text>
                </View>
              </View>
            </View>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
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
    color: '#FFFFFF',
    fontWeight: '600',
  },
  deliveriesList: {
    gap: 6,
  },
  deliveryWrapper: {
    marginBottom: 2,
  },
  deliveryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  deliveryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
  },
  deliveryInfo: {
    flex: 1,
  },
  deliveryId: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 1,
  },
  deliveryTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 1,
  },
  deliveryTime: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  deliveryDetails: {
    alignItems: 'flex-end',
  },
  itemCount: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
    marginBottom: 1,
  },
  orderValue: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 1,
  },
  transporter: {
    fontSize: 9,
    color: '#8B5CF6',
    fontWeight: '500',
  },
});

export default RecentDeliveries;