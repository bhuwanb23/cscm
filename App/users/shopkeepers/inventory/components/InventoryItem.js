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
import { INVENTORY_CONSTANTS } from '../constants';

const InventoryItem = ({ item, onQuickUpdate, onViewDetails }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    onQuickUpdate(item);
  };

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
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <TouchableOpacity 
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.itemContent}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bgColor }]}>
              <Text style={[styles.statusText, { color: statusStyle.textColor }]}>
                {statusStyle.label}
              </Text>
            </View>
          </View>
          
          <View style={styles.itemDetails}>
            <Text style={styles.skuText}>SKU: {item.sku}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.supplierText} numberOfLines={1}>{item.supplier}</Text>
          </View>
          
          <View style={styles.itemFooter}>
            <View style={styles.quantityContainer}>
              <Text style={[styles.quantityText, { color: statusStyle.color }]}>
                {item.quantity}
              </Text>
              <Text style={styles.quantityLabel}>
                {item.quantity === 1 ? 'unit' : 'units'}
              </Text>
            </View>
            
            {item.expiryDate ? (
              <Text style={styles.expiryText}>Exp: {item.expiryDate}</Text>
            ) : (
              <TouchableOpacity onPress={() => onViewDetails(item)}>
                <Text style={styles.actionText}>Details</Text>
              </TouchableOpacity>
            )}
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
  itemContent: {
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
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
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  skuText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  separator: {
    fontSize: 11,
    color: '#6B7280',
    marginHorizontal: 6,
  },
  supplierText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
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
    fontSize: 16,
    fontWeight: '800',
    marginRight: 4,
  },
  quantityLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  expiryText: {
    fontSize: 10,
    color: '#EA580C',
    fontWeight: '600',
  },
  actionText: {
    fontSize: 11,
    color: '#3B82F6',
    fontWeight: '600',
  },
});

export default InventoryItem;
