import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useOrdersData } from './hooks/useOrdersData';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'dispatched', label: 'Dispatched' },
  { id: 'delivered', label: 'Delivered' },
];

const STATUS_COLORS = {
  pending: { bg: '#FEF3C7', fg: '#92400E' },
  approved: { bg: '#DBEAFE', fg: '#1E40AF' },
  dispatched: { bg: '#D1FAE5', fg: '#065F46' },
  delivered: { bg: '#D1FAE5', fg: '#065F46' },
  rejected: { bg: '#FEE2E2', fg: '#B91C1C' },
};

const PRIORITY_COLORS = { urgent: '#EF4444', high: '#F59E0B', normal: '#3B82F6', low: '#6B7280' };

const Orders = ({ onLogout }) => {
  const { orders, counts, activeFilter, setActiveFilter, approveOrder, dispatchOrder, rejectOrder, refetch } = useOrdersData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } };

  return (
    <View style={styles.container}>
      <Header title="Orders" subtitle={`${orders.length} orders`} onLogout={onLogout} />
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            const count = counts[f.id];
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveFilter(f.id)}
              >
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
        {orders.length === 0 ? (
          <View style={styles.empty}><Ionicons name="receipt-outline" size={48} color="#9CA3AF" /><Text style={styles.emptyText}>No orders in this view</Text></View>
        ) : orders.map((order) => {
          const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
          const pc = PRIORITY_COLORS[order.priority] || PRIORITY_COLORS.normal;
          return (
            <Card key={order.id} style={styles.orderCard}>
              <View style={styles.row}>
                <View style={styles.left}>
                  <View style={styles.idRow}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <View style={[styles.priorityDot, { backgroundColor: pc }]} />
                  </View>
                  <Text style={styles.retailer}>{order.retailer}</Text>
                  <Text style={styles.meta}>{order.items} items • ${order.value.toLocaleString()}</Text>
                </View>
                <View style={styles.right}>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.fg }]}>{order.status}</Text>
                  </View>
                </View>
              </View>
              {order.status === 'pending' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.action, styles.approve]} onPress={() => approveOrder(order.id)}>
                    <Ionicons name="checkmark" size={14} color="#fff" /><Text style={styles.actionText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.action, styles.reject]} onPress={() => rejectOrder(order.id)}>
                    <Ionicons name="close" size={14} color="#fff" /><Text style={styles.actionText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
              {order.status === 'approved' && (
                <View style={styles.actions}>
                  <TouchableOpacity style={[styles.action, styles.dispatch]} onPress={() => dispatchOrder(order.id)}>
                    <Ionicons name="car" size={14} color="#fff" /><Text style={styles.actionText}>Dispatch</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  orderCard: { borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  left: { flex: 1 },
  right: { alignItems: 'flex-end' },
  idRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orderId: { fontSize: 15, fontWeight: '700', color: '#111827' },
  priorityDot: { width: 8, height: 8, borderRadius: 4 },
  retailer: { fontSize: 13, color: '#3B82F6', fontWeight: '500', marginTop: 4 },
  meta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  action: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, gap: 4 },
  approve: { backgroundColor: '#10B981' },
  reject: { backgroundColor: '#EF4444' },
  dispatch: { backgroundColor: '#3B82F6' },
  actionText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
});

export default Orders;
