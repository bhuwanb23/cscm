import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useInventoryData } from './hooks/useInventoryData';

const Inventory = ({ onLogout }) => {
  const { items, counts, searchQuery, setSearchQuery, activeFilter, setActiveFilter, updateQuantity, refetch } = useInventoryData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } };

  const handleAdjust = (item, delta) => {
    const next = Math.max(0, item.quantity + delta);
    updateQuantity(item.id, next);
  };

  return (
    <View style={styles.container}>
      <Header title="Inventory" subtitle={`${items.length} items in stock`} onLogout={onLogout} />
      <View style={styles.controls}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search inventory..."
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity style={[styles.chip, activeFilter === 'all' && styles.chipActive]} onPress={() => setActiveFilter('all')}>
            <Text style={[styles.chipText, activeFilter === 'all' && styles.chipTextActive]}>All ({counts.all})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, activeFilter === 'low-stock' && styles.chipActive]} onPress={() => setActiveFilter('low-stock')}>
            <Text style={[styles.chipText, activeFilter === 'low-stock' && styles.chipTextActive]}>Low Stock ({counts.lowStock})</Text>
          </TouchableOpacity>
        </View>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
      >
        {items.length === 0 ? (
          <View style={styles.empty}><Ionicons name="cube-outline" size={48} color="#9CA3AF" /><Text style={styles.emptyText}>No items</Text></View>
        ) : items.map((item) => {
          const isLow = item.quantity <= item.reorder_point;
          return (
            <Card key={item.id} style={styles.itemCard}>
              <View style={styles.row}>
                <View style={styles.itemIcon}>
                  <Ionicons name="cube" size={20} color={isLow ? '#EF4444' : '#3B82F6'} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSku}>{item.sku} • {item.category}</Text>
                  <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.itemRight}>
                  <View style={[styles.qtyBadge, isLow && styles.qtyBadgeLow]}>
                    <Text style={[styles.qtyText, isLow && styles.qtyTextLow]}>{item.quantity}</Text>
                  </View>
                  <View style={styles.adjustRow}>
                    <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjust(item, -10)}>
                      <Ionicons name="remove" size={14} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.adjustBtn} onPress={() => handleAdjust(item, 10)}>
                      <Ionicons name="add" size={14} color="#3B82F6" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  controls: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, backgroundColor: '#F8FAFC' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  searchInput: { flex: 1, paddingVertical: 8, paddingHorizontal: 8, fontSize: 14, color: '#111827' },
  filterRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#FFFFFF' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  itemCard: { borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  itemIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  itemSku: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  itemPrice: { fontSize: 12, color: '#10B981', fontWeight: '600', marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 6 },
  qtyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#DBEAFE' },
  qtyBadgeLow: { backgroundColor: '#FEE2E2' },
  qtyText: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },
  qtyTextLow: { color: '#B91C1C' },
  adjustRow: { flexDirection: 'row', gap: 4 },
  adjustBtn: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
});

export default Inventory;
