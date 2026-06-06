import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useAlertsData } from './hooks/useAlertsData';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'unacknowledged', label: 'Active' },
  { id: 'critical', label: 'Critical' },
  { id: 'high', label: 'High' },
];

const Alerts = ({ onBack }) => {
  const { alerts, counts, activeFilter, setActiveFilter, acknowledge, severityMeta, refetch } = useAlertsData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } };

  return (
    <View style={styles.container}>
      <Header title="Mesh Alerts" subtitle="Anomaly detection across the network" onBack={onBack} />
      <View style={styles.banner}>
        <LinearGradient colors={['#3B82F6', '#1E40AF']} style={styles.bannerGradient}>
          <Ionicons name="pulse" size={20} color="#FFFFFF" />
          <Text style={styles.bannerText}>{counts.unacknowledged} active alerts • {counts.critical} critical</Text>
        </LinearGradient>
      </View>
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {FILTERS.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <TouchableOpacity key={f.id} style={[styles.chip, isActive && styles.chipActive]} onPress={() => setActiveFilter(f.id)}>
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{f.label}</Text>
                {typeof counts[f.id] === 'number' && counts[f.id] > 0 && (
                  <Text style={[styles.chipCount, isActive && styles.chipCountActive]}>({counts[f.id]})</Text>
                )}
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
        {alerts.length === 0 ? (
          <View style={styles.empty}><Ionicons name="checkmark-circle-outline" size={48} color="#10B981" /><Text style={styles.emptyText}>No alerts in this view</Text></View>
        ) : alerts.map((alert) => {
          const meta = severityMeta[alert.severity] || severityMeta.info;
          return (
            <Card key={alert.id} style={[styles.alertCard, alert.acknowledged && styles.alertCardAck]}>
              <View style={styles.row}>
                <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.fg} />
                </View>
                <View style={styles.info}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{alert.title}</Text>
                    {alert.acknowledged && <Ionicons name="checkmark-circle" size={14} color="#10B981" />}
                  </View>
                  <Text style={styles.description}>{alert.description}</Text>
                  <View style={styles.metaRow}>
                    <View style={[styles.severityBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.severityText, { color: meta.fg }]}>{alert.severity}</Text>
                    </View>
                    <Text style={styles.source}>{alert.source}</Text>
                    {alert.created_at ? <Text style={styles.time}>{new Date(alert.created_at).toLocaleString()}</Text> : null}
                  </View>
                  {!alert.acknowledged && (
                    <TouchableOpacity style={styles.ackButton} onPress={() => acknowledge(alert.id)}>
                      <Text style={styles.ackButtonText}>Acknowledge</Text>
                    </TouchableOpacity>
                  )}
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
  banner: { paddingHorizontal: 16, paddingVertical: 8 },
  bannerGradient: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, gap: 8 },
  bannerText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
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
  alertCard: { borderRadius: 12, padding: 12, marginBottom: 10, elevation: 1 },
  alertCardAck: { opacity: 0.6 },
  row: { flexDirection: 'row', gap: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 14, fontWeight: '700', color: '#111827', flex: 1 },
  description: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, flexWrap: 'wrap' },
  severityBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  source: { fontSize: 10, color: '#6B7280' },
  time: { fontSize: 10, color: '#9CA3AF' },
  ackButton: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: '#3B82F6', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  ackButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
});

export default Alerts;
