import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ItemSearch = ({ searchQuery, onSearchChange, filteredItems, onAddItem }) => {
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search items..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={onSearchChange}
        />
      </View>

      <ScrollView style={styles.itemsList} showsVerticalScrollIndicator={false}>
        {filteredItems.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <View style={[styles.itemIcon, { backgroundColor: item.iconBgColor }]}>
                <Ionicons name={item.icon} size={20} color={item.iconColor} />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
              </View>
            </View>
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => onAddItem({ ...item, quantity: -1 })}
              >
                <Ionicons name="remove" size={16} color="#9CA3AF" />
              </TouchableOpacity>
              <Text style={styles.quantityText}>{item.currentQuantity || 0}</Text>
              <TouchableOpacity
                style={[styles.quantityButton, styles.addButton]}
                onPress={() => onAddItem({ ...item, quantity: 1 })}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  itemsList: {
    maxHeight: 300,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 12,
    color: '#6B7280',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  quantityText: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
});

export default ItemSearch;
