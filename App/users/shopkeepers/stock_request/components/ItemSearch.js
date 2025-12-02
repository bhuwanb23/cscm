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
      <View style={styles.gradientContainer}>
        <Text style={styles.title}>Search Items</Text>
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" style={styles.searchIcon} />
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
            <View
              key={item.id}
              style={styles.itemWrapper}
            >
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <View style={[styles.itemIcon, { backgroundColor: item.iconBgColor }]}>
                    <Ionicons name={item.icon} size={16} color={item.iconColor} />
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    {item.description && (
                      <Text style={styles.itemDescription} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                    {item.price && (
                      <Text style={styles.itemPrice}>{item.price}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.quantityControls}>
                  <TouchableOpacity
                    style={styles.quantityButton}
                    onPress={() => onAddItem({ ...item, quantity: -1 })}
                  >
                    <Ionicons name="remove" size={12} color="#9CA3AF" />
                  </TouchableOpacity>
                  <Text style={styles.quantityText}>{item.currentQuantity || 0}</Text>
                  <TouchableOpacity
                    style={[styles.quantityButton, styles.addButton]}
                    onPress={() => onAddItem({ ...item, quantity: 1 })}
                  >
                    <Ionicons name="add" size={12} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  gradientContainer: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1F2937',
  },
  itemsList: {
    maxHeight: 300,
  },
  itemWrapper: {
    marginBottom: 4,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 1,
  },
  itemCategory: {
    fontSize: 10,
    color: '#6B7280',
  },
  itemDescription: {
    fontSize: 9,
    color: '#9CA3AF',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quantityButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    width: 24,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
});

export default ItemSearch;