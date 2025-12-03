import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SelectedItems = ({ selectedItems, onRemoveItem, onSubmitRequest }) => {
  if (selectedItems.length === 0) {
    return null;
  }

  // Calculate total items and total value
  const totalItems = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = selectedItems.reduce((sum, item) => {
    if (item.price) {
      const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ""));
      return sum + (price * item.quantity);
    }
    return sum;
  }, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Selected Items ({totalItems} total)</Text>
        <Text style={styles.totalValue}>Estimated Total: ${totalValue.toFixed(2)}</Text>
      </View>
      
      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {selectedItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>Quantity: {item.quantity}</Text>
              {item.category && (
                <Text style={styles.itemCategory}>{item.category}</Text>
              )}
              {item.price && (
                <Text style={styles.itemPrice}>Price: {item.price}</Text>
              )}
              {item.supplier && (
                <Text style={styles.itemSupplier}>Supplier: {item.supplier}</Text>
              )}
              {item.sku && (
                <Text style={styles.itemSku}>SKU: {item.sku}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => onRemoveItem(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.submitButton} onPress={onSubmitRequest}>
        <Text style={styles.submitButtonText}>Submit Request</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  itemsList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 1,
  },
  itemCategory: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 1,
  },
  itemPrice: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
    marginBottom: 1,
  },
  itemSupplier: {
    fontSize: 11,
    color: '#8B5CF6',
    marginBottom: 1,
  },
  itemSku: {
    fontSize: 10,
    color: '#6B7280',
  },
  removeButton: {
    padding: 8,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SelectedItems;