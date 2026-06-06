import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useDashboardData } from './hooks/useDashboardData';

const STATUS_COLORS = {
  pending: { bg: '#FEF3C7', fg: '#92400E' },
  approved: { bg: '#DBEAFE', fg: '#1E40AF' },
  dispatched: { bg: '#D1FAE5', fg: '#065F46' },
  delivered: { bg: '#D1FAE5', fg: '#065F46' },
  rejected: { bg: '#FEE2E2', fg: '#B91C1C' },
};

const Dashboard = ({ onLogout }) => {
  const { stats, recentOrders, topRetailers, approveOrder, refetch, loading } = useDashboardData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } };

  return (
    <View style={styles.container}>
      <Header title="Wholesaler Dashboard" subtitle="Supply Management" onLogout={onLogout} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
      >
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.statIcon}>
                <Ionicons name="cart" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statLabel}>Today Orders</Text>
              <Text style={styles.statValue}>{stats.todayOrders}</Text>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <LinearGradient colors={['#F59E0B', '#D97706']} style={styles.statIcon}>
                <Ionicons name="time" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{stats.pendingFulfillment}</Text>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.statIcon}>
                <Ionicons name="alert-circle" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statLabel}>Low Stock</Text>
              <Text style={styles.statValue}>{stats.lowStockItems}</Text>
            </View>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.statIcon}>
                <Ionicons name="trending-up" size={18} color="#fff" />
              </LinearGradient>
              <Text style={styles.statLabel}>Revenue</Text>
              <Text style={styles.statValue}>${(stats.monthlyRevenue / 1000).toFixed(1)}k</Text>
            </View>
          </Card>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => Alert.alert('Orders', 'Navigate to full orders list')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {recentOrders.map((order) => {
            const colors = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
            return (
              <Card key={order.id} style={styles.orderCard}>
                <View style={styles.orderRow}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderId}>{order.id}</Text>
                    <Text style={styles.orderRetailer}>{order.retailer}</Text>
                    <Text style={styles.orderMeta}>{order.items} items • ${order.value.toLocaleString()}</Text>
                  </View>
                  <View style={styles.orderActions}>
                    <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
                      <Text style={[styles.statusText, { color: colors.fg }]}>{order.status}</Text>
                    </View>
                    {order.status === 'pending' && (
                      <TouchableOpacity style={styles.approveButton} onPress={() => approveOrder(order.id)}>
                        <Text style={styles.approveButtonText}>Approve</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Card>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Retailers</Text>
          {topRetailers.map((retailer, index) => (
            <Card key={retailer.id || index} style={styles.retailerCard}>
              <View style={styles.retailerRow}>
                <View style={styles.rank}>
                  <Text style={styles.rankText}>#{index + 1}</Text>
                </View>
                <View style={styles.retailerInfo}>
                  <Text style={styles.retailerName}>{retailer.name}</Text>
                  <Text style={styles.retailerMeta}>{retailer.orders} orders</Text>
                </View>
                <Text style={styles.retailerValue}>${(retailer.value / 1000).toFixed(1)}k</Text>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: { flexBasis: '48%', flexGrow: 1, borderRadius: 12, elevation: 2 },
  statContent: { padding: 12, alignItems: 'center' },
  statIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statLabel: { fontSize: 11, color: '#6B7280', fontWeight: '500' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  seeAll: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  orderCard: { borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1 },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderInfo: { flex: 1 },
  orderId: { fontSize: 14, fontWeight: '700', color: '#111827' },
  orderRetailer: { fontSize: 12, color: '#3B82F6', fontWeight: '500', marginTop: 2 },
  orderMeta: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  orderActions: { alignItems: 'flex-end', gap: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  approveButton: { backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  approveButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  retailerCard: { borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1 },
  retailerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 12, fontWeight: '700', color: '#1E40AF' },
  retailerInfo: { flex: 1 },
  retailerName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  retailerMeta: { fontSize: 11, color: '#6B7280', marginTop: 1 },
  retailerValue: { fontSize: 14, fontWeight: '700', color: '#10B981' },
});

export default Dashboard;
