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

  const handlePress = () => {
    onActionPress(shipment);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.touchable} activeOpacity={0.9}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={styles.shipmentId}>#{shipment.id}</Text>
              <Text style={styles.shipmentTitle} numberOfLines={1}>{shipment.title}</Text>
              {shipment.description && (
                <Text style={styles.shipmentDescription} numberOfLines={1}>
                  {shipment.description}
                </Text>
              )}
            </View>
            <View 
              style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}
            >
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
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(shipment.progress, 100)}%`,
                      backgroundColor: getProgressColor(shipment.status),
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

          {/* Additional Details */}
          <View style={styles.additionalDetails}>
            <View style={styles.detailRow}>
              <Ionicons name="cube" size={12} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>{shipment.items} items</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="weight-hanging" size={12} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>{shipment.weight}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="money-bill" size={12} color="#6B7280" style={styles.detailIcon} />
              <Text style={styles.detailText}>{shipment.orderValue}</Text>
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
              <View 
                style={[styles.actionGradient, { 
                  backgroundColor: shipment.actionColor === '#3B82F6' ? '#3B82F6' : '#22C55E' 
                }]}
              >
                <Text style={styles.actionText}>
                  {shipment.actionText}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
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
    backgroundColor: '#FFFFFF',
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
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 1,
  },
  shipmentDescription: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
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
  additionalDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailIcon: {
    marginRight: 2,
  },
  detailText: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
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