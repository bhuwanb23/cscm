import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ShipmentCard = ({ shipment, onActionPress, getStatusStyle }) => {
  const statusStyle = getStatusStyle(shipment.status);

  const getProgressColor = (status) => {
    switch (status) {
      case 'in_transit':
        return '#2563EB';
      case 'arriving_soon':
        return '#10B981';
      case 'delayed':
        return '#F59E0B';
      case 'out_for_delivery':
        return '#A855F7';
      default:
        return '#2563EB';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.shipmentId}>#{shipment.id}</Text>
            <Text style={styles.shipmentTitle}>{shipment.title}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercentage}>{shipment.progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${shipment.progress}%`,
                  backgroundColor: getProgressColor(shipment.status),
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>ETA</Text>
            <Text style={styles.detailValue}>{shipment.eta}</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Transporter</Text>
            <Text style={styles.detailValue}>{shipment.transporter}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <Ionicons
              name={shipment.icon}
              size={16}
              color={shipment.iconColor}
            />
            <Text style={styles.distanceText}>{shipment.distance}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: shipment.actionColor === '#3B82F6' ? '#EFF6FF' : '#D1FAE5' },
            ]}
            onPress={() => onActionPress(shipment)}
          >
            <Text
              style={[
                styles.actionText,
                { color: shipment.actionColor },
              ]}
            >
              {shipment.actionText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
  },
  shipmentId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  shipmentTitle: {
    fontSize: 14,
    color: '#6B7280',
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
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressPercentage: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#6B7280',
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default ShipmentCard;
