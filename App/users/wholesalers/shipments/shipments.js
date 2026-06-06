import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useShipmentsData } from './hooks/useShipmentsData';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'in_transit', label: 'In Transit' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
];

const STATUS_COLORS = {
  in_transit: { bg: '#DBEAFE', fg: '#1E40AF' },
  dispatched: { bg: '#D1FAE5', fg: '#065F46' },
  delivered: { bg: '#D1FAE5', fg: '#065F46' },
  pending: { bg: '#FEF3C7', fg: '#92400E' },
};

const Shipments = ({ onLogout }) => {
  const { shipments, counts, activeFilter, setActiveFilter, refetch } = useShipmentsData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } };

  return (
    <View style={styles.container}>
      <Header title="Shipments" subtitle="Track and manage dispatches" onLogout={onLogout} />
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            const count = counts[f.id];
            return (
              <TouchableOpacity key={f.id} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setActiveFilter(f.id)}>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
                {typeof count === 'number' && <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>({count})</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
      >
        {shipments.length === 0 ? (
          <View style={styles.empty}><Ionicons name="car-outline" size={48} color="#9CA3AF" /><Text style={styles.emptyText}>No shipments in this view</Text></View>
        ) : shipments.map((shipment) => {
          const sc = STATUS_COLORS[shipment.status] || STATUS_COLORS.pending;
          return (
            <Card key={shipment.id} style={styles.shipCard}>
              <View style={styles.row}>
                <View style={styles.shipIcon}>
                  <Ionicons name="car" size={20} color="#3B82F6" />
                </View>
                <View style={styles.shipInfo}>
                  <Text style={styles.shipId}>{shipment.id}</Text>
                  <Text style={styles.shipRetailer}>{shipment.retailer}</Text>
                  <Text style={styles.shipMeta}>{shipment.items} items • {shipment.carrier}</Text>
                  {shipment.tracking ? <Text style={styles.shipTrack}>Tracking: {shipment.tracking}</Text> : null}
                </View>
                <View style={styles.shipRight}>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.fg }]}>{shipment.status.replace('_', ' ')}</Text>
                  </View>
                  <Text style={styles.eta}>{shipment.eta}</Text>
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
  filterRow: { backgroundColor: '#F8FAFC', paddingVertical: 8 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', gap: 4 },
  chipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  chipText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  chipTextActive: { color: '#FFFFFF' },
  chipCount: { fontSize: 11, color: '#9CA3AF' },
  chipCountActive: { color: '#DBEAFE' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  shipCard: { borderRadius: 12, padding: 12, marginBottom: 10, elevation: 1 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  shipIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  shipInfo: { flex: 1 },
  shipId: { fontSize: 14, fontWeight: '700', color: '#111827' },
  shipRetailer: { fontSize: 12, color: '#3B82F6', fontWeight: '500', marginTop: 2 },
  shipMeta: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  shipTrack: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  shipRight: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  eta: { fontSize: 10, color: '#6B7280', marginTop: 4 },
});

export default Shipments;
