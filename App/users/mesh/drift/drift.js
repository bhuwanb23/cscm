import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useDriftData } from './hooks/useDriftData';

const Drift = ({ onBack }) => {
  const { snapshot, history, isCritical, triggerRetrain, refetch } = useDriftData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } };

  const accuracyPct = Math.round(snapshot.current_accuracy * 100);
  const baselinePct = Math.round(snapshot.baseline_accuracy * 100);
  const maxScore = Math.max(...history.map(h => h.score), snapshot.threshold, 0.15);

  return (
    <View style={styles.container}>
      <Header title="Drift Detection" subtitle="Model performance monitoring" onBack={onBack} />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />}
      >
        <LinearGradient colors={isCritical ? ['#EF4444', '#B91C1C'] : ['#10B981', '#059669']} style={styles.statusBanner}>
          <Ionicons name={isCritical ? 'alert-circle' : 'checkmark-circle'} size={24} color="#FFFFFF" />
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>{isCritical ? 'DRIFT DETECTED' : 'All Models Healthy'}</Text>
            <Text style={styles.statusSubtitle}>{snapshot.model} • drift score {snapshot.drift_score.toFixed(3)}</Text>
          </View>
        </LinearGradient>

        <Card style={styles.modelCard}>
          <Text style={styles.cardTitle}>{snapshot.model}</Text>
          <View style={styles.accuracyRow}>
            <View style={styles.accuracyItem}>
              <Text style={styles.accuracyLabel}>Baseline</Text>
              <Text style={styles.accuracyValue}>{baselinePct}%</Text>
            </View>
            <View style={styles.accuracyItem}>
              <Text style={styles.accuracyLabel}>Current</Text>
              <Text style={[styles.accuracyValue, isCritical && styles.accuracyValueAlert]}>{accuracyPct}%</Text>
            </View>
            <View style={styles.accuracyItem}>
              <Text style={styles.accuracyLabel}>Threshold</Text>
              <Text style={styles.accuracyValue}>{Math.round(snapshot.threshold * 100)}%</Text>
            </View>
          </View>
        </Card>

        <Card style={styles.chartCard}>
          <Text style={styles.cardTitle}>Drift Score History (24h)</Text>
          <View style={styles.chartContainer}>
            <View style={styles.chart}>
              {history.map((point, i) => {
                const heightPct = (point.score / maxScore) * 100;
                const isOver = point.score >= snapshot.threshold;
                return (
                  <View key={i} style={styles.barWrapper}>
                    <View style={[styles.bar, { height: `${heightPct}%`, backgroundColor: isOver ? '#EF4444' : '#3B82F6' }]} />
                    <Text style={styles.barLabel}>{point.time}</Text>
                  </View>
                );
              })}
              <View style={[styles.thresholdLine, { bottom: `${(snapshot.threshold / maxScore) * 100}%` }]}>
                <Text style={styles.thresholdLabel}>threshold</Text>
              </View>
            </View>
          </View>
        </Card>

        {snapshot.affected_clusters && (
          <Card style={styles.clustersCard}>
            <Text style={styles.cardTitle}>Affected Clusters</Text>
            <View style={styles.clusterRow}>
              {snapshot.affected_clusters.map((c, i) => (
                <View key={i} style={styles.clusterChip}>
                  <Ionicons name="location" size={12} color="#B91C1C" />
                  <Text style={styles.clusterText}>{c}</Text>
                </View>
              ))}
            </View>
            {snapshot.recommended_action && (
              <View style={styles.recommendRow}>
                <Ionicons name="bulb" size={14} color="#F59E0B" />
                <Text style={styles.recommendText}>{snapshot.recommended_action}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.retrainButton} onPress={triggerRetrain}>
              <Ionicons name="refresh" size={14} color="#FFFFFF" />
              <Text style={styles.retrainButtonText}>Trigger Retrain</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, gap: 12, marginBottom: 16 },
  statusInfo: { flex: 1 },
  statusTitle: { fontSize: 14, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
  statusSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  modelCard: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  accuracyRow: { flexDirection: 'row', justifyContent: 'space-around' },
  accuracyItem: { alignItems: 'center' },
  accuracyLabel: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase' },
  accuracyValue: { fontSize: 20, fontWeight: '700', color: '#3B82F6', marginTop: 4 },
  accuracyValueAlert: { color: '#EF4444' },
  chartCard: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  chartContainer: { height: 140 },
  chart: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 4, position: 'relative' },
  barWrapper: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', height: '100%' },
  bar: { width: '70%', borderTopLeftRadius: 3, borderTopRightRadius: 3, minHeight: 4 },
  barLabel: { fontSize: 9, color: '#9CA3AF', marginTop: 2 },
  thresholdLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#F59E0B' },
  thresholdLabel: { position: 'absolute', right: 0, top: -12, fontSize: 9, color: '#F59E0B', fontWeight: '600' },
  clustersCard: { borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  clusterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  clusterChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEE2E2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 4 },
  clusterText: { fontSize: 12, color: '#B91C1C', fontWeight: '500' },
  recommendRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7', padding: 8, borderRadius: 8, marginBottom: 8, gap: 6 },
  recommendText: { flex: 1, fontSize: 12, color: '#92400E' },
  retrainButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#3B82F6', paddingVertical: 8, borderRadius: 8, gap: 6 },
  retrainButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
});

export default Drift;
