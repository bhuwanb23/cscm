import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useNetworkData } from './hooks/useNetworkData';

const TYPE_COLORS = {
  shopkeeper: '#3B82F6',
  wholesaler: '#8B5CF6',
  warehouse: '#F59E0B',
  transporter: '#10B981',
  'central-planner': '#EF4444',
};

const TYPE_ICONS = {
  shopkeeper: 'storefront',
  wholesaler: 'business',
  warehouse: 'archive',
  transporter: 'car',
  'central-planner': 'pulse',
};

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'shopkeeper', label: 'Shops' },
  { id: 'wholesaler', label: 'Wholesalers' },
  { id: 'warehouse', label: 'Warehouses' },
  { id: 'transporter', label: 'Transporters' },
];

const Network = ({ onBack }) => {
  const { nodes, counts, selectedType, setSelectedType, refetch } = useNetworkData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } };

  return (
    <View style={styles.container}>
      <Header title="Network" subtitle="Mesh topology at a glance" onBack={onBack} />
      <View style={styles.banner}>
        <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.bannerGradient}>
          <View style={styles.bannerStat}>
            <Text style={styles.bannerValue}>{nodes.length}</Text>
            <Text style={styles.bannerLabel}>Active Nodes</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerStat}>
            <Text style={styles.bannerValue}>{nodes.filter(n => n.status === 'active').length}</Text>
            <Text style={styles.bannerLabel}>Online</Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.bannerStat}>
            <Text style={styles.bannerValue}>{nodes.filter(n => n.status === 'warning' || n.status === 'inactive').length}</Text>
            <Text style={styles.bannerLabel}>Attention</Text>
          </View>
        </LinearGradient>
      </View>
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {TYPE_FILTERS.map((f) => {
            const isActive = selectedType === f.id;
            return (
              <TouchableOpacity key={f.id} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setSelectedType(f.id)}>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
                <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>({counts[f.id] || 0})</Text>
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
        {nodes.length === 0 ? (
          <View style={styles.empty}><Ionicons name="git-network-outline" size={48} color="#9CA3AF" /><Text style={styles.emptyText}>No nodes in this view</Text></View>
        ) : nodes.map((node) => {
          const color = TYPE_COLORS[node.type] || '#6B7280';
          const icon = TYPE_ICONS[node.type] || 'cube';
          const isWarn = node.status === 'warning' || node.status === 'inactive';
          return (
            <Card key={node.id} style={styles.nodeCard}>
              <View style={styles.nodeRow}>
                <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
                  <Ionicons name={icon} size={18} color={color} />
                </View>
                <View style={styles.nodeInfo}>
                  <Text style={styles.nodeLabel}>{node.label}</Text>
                  <Text style={styles.nodeMeta}>{node.type.replace('-', ' ')} • {node.region || '—'}</Text>
                  {typeof node.utilization === 'number' && (
                    <View style={styles.utilBar}>
                      <View style={[styles.utilFill, { width: `${Math.round(node.utilization * 100)}%`, backgroundColor: node.utilization > 0.9 ? '#EF4444' : color }]} />
                    </View>
                  )}
                </View>
                <View style={[styles.statusDot, isWarn && styles.statusDotWarn]} />
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
  banner: { paddingHorizontal: 16, paddingVertical: 8 },
  bannerGradient: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10 },
  bannerStat: { flex: 1, alignItems: 'center' },
  bannerValue: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  bannerLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2, textTransform: 'uppercase' },
  bannerDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.3)' },
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
  nodeCard: { borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1 },
  nodeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  nodeInfo: { flex: 1 },
  nodeLabel: { fontSize: 14, fontWeight: '700', color: '#111827' },
  nodeMeta: { fontSize: 11, color: '#6B7280', marginTop: 2, textTransform: 'capitalize' },
  utilBar: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, marginTop: 6, overflow: 'hidden' },
  utilFill: { height: '100%' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  statusDotWarn: { backgroundColor: '#F59E0B' },
});

export default Network;
