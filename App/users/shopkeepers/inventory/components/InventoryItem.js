import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { INVENTORY_CONSTANTS } from '../constants';

const InventoryItem = ({ item, onQuickUpdate, onViewDetails }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'low':
        return INVENTORY_CONSTANTS.STOCK_STATUS.LOW;
      case 'in-stock':
        return INVENTORY_CONSTANTS.STOCK_STATUS.IN_STOCK;
      case 'expiring':
        return INVENTORY_CONSTANTS.STOCK_STATUS.EXPIRING;
      default:
        return INVENTORY_CONSTANTS.STOCK_STATUS.IN_STOCK;
    }
  };

  const statusStyle = getStatusStyle(item.status);

  return (
    <TouchableOpacity 
      style={[styles.container, item.borderColor && { borderLeftWidth: 4, borderLeftColor: item.borderColor }]}
      onPress={() => onQuickUpdate(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.skuText}>SKU: {item.sku}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.supplierText}>{item.supplier}</Text>
        </View>
        
        <View style={styles.itemFooter}>
          <View style={styles.quantityContainer}>
            <Text style={[styles.quantityText, { color: statusStyle.color }]}>
              {item.quantity}
            </Text>
            <Text style={styles.quantityLabel}>
              {item.quantity === 1 ? 'unit' : 'units'} left
            </Text>
          </View>
          
          {item.expiryDate ? (
            <Text style={styles.expiryText}>Exp: {item.expiryDate}</Text>
          ) : (
            <TouchableOpacity onPress={onViewDetails}>
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContent: {
    padding: 16,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
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
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  skuText: {
    fontSize: 14,
    color: '#6B7280',
  },
  separator: {
    fontSize: 14,
    color: '#6B7280',
    marginHorizontal: 8,
  },
  supplierText: {
    fontSize: 14,
    color: '#6B7280',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  expiryText: {
    fontSize: 12,
    color: '#EA580C',
    fontWeight: '500',
  },
  actionText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default InventoryItem;
