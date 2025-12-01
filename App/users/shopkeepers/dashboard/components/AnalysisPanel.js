import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const formatCurrency = (value = 0) => {
  const rounded = Math.round(value);
  return `$${rounded.toLocaleString('en-US')}`;
};

const formatNumber = (value = 0) => value.toLocaleString('en-US');

const SummaryStat = ({ label, value, accent }) => (
  <View style={styles.statBlock}>
    <Text style={[styles.statValue, accent && { color: accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const AnalysisPanel = ({ analysis, onStart }) => {
  const { status, steps, summary, recommendations } = analysis;
  const statusStyles = {
    idle: { label: 'Ready', color: '#CBD5F5', text: '#1E40AF' },
    running: { label: 'Scanning', color: '#FDE68A', text: '#92400E' },
    completed: { label: 'Insights Ready', color: '#DCFCE7', text: '#065F46' },
  };

  const currentStatusStyle = statusStyles[status] ?? statusStyles.idle;
  const topRecommendations = (recommendations || []).slice(0, 3);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2600,
        useNativeDriver: false,
      }).start();
    } else {
      pulseAnim.setValue(1);
      progressAnim.setValue(status === 'completed' ? 1 : 0);
    }
  }, [status, pulseAnim, progressAnim]);

  const renderIdle = () => (
    <View style={styles.sectionBody}>
      <Text style={styles.sectionText}>
        Kick off the smart analysis workflow to scan carts, inventory, and supplier SLAs using
        sample data. We will highlight SKUs that should be replenished before tomorrow’s visit.
      </Text>
      <View style={styles.chipRow}>
        <View style={styles.chip}>
          <Ionicons name="cube-outline" size={12} color="#1D4ED8" />
          <Text style={styles.chipText}>Digital twins</Text>
        </View>
        <View style={styles.chip}>
          <Ionicons name="git-network-outline" size={12} color="#6B21A8" />
          <Text style={styles.chipText}>AI agents mesh</Text>
        </View>
        <View style={styles.chip}>
          <Ionicons name="options-outline" size={12} color="#047857" />
          <Text style={styles.chipText}>Optimization + HITL</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.primaryButton} onPress={onStart}>
        <LinearGradient
          colors={['#2563EB', '#1E3A8A']}
          style={styles.primaryButtonGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="pulse" size={18} color="#FFFFFF" />
          <Text style={styles.primaryButtonText}>Start Analysis</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderRunning = () => (
    <View style={styles.sectionBody}>
      <View style={styles.runningHeader}>
        <ActivityIndicator color="#1E40AF" size="small" />
        <Text style={styles.sectionText}>Scanning sample telemetry...</Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['8%', '100%'],
              }),
            },
          ]}
        />
      </View>
      {steps.map(step => (
        <View key={step.id} style={styles.stepRow}>
          <Ionicons
            name={step.completed ? 'checkmark-circle' : 'radio-button-off'}
            size={18}
            color={step.completed ? '#16A34A' : '#94A3B8'}
          />
          <Text style={styles.stepLabel}>{step.label}</Text>
        </View>
      ))}
    </View>
  );

  const renderResults = () => {
    if (!summary) {
      return null;
    }

    return (
      <View style={styles.sectionBody}>
        <View style={styles.summaryRow}>
          <SummaryStat
            label="SKUs flagged"
            value={formatNumber(summary.flaggedCount || 0)}
            accent="#DC2626"
          />
          <SummaryStat
            label="Units short"
            value={formatNumber(summary.shortfallUnits || 0)}
            accent="#C2410C"
          />
          <SummaryStat
            label="Revenue at risk"
            value={formatCurrency(summary.revenueRisk || 0)}
          />
        </View>
        <View style={styles.summaryDetails}>
          <View style={styles.badgeRow}>
            <View style={styles.riskBadge}>
              <Ionicons name="flame" size={14} color="#B45309" />
              <Text style={styles.riskBadgeText}>Risk: {summary.riskLevel}</Text>
            </View>
            <Text style={styles.metaText}>
              Avg lead time • {summary.avgLeadTime?.toFixed(1) || '0.0'} days
            </Text>
          </View>
          <Text style={styles.sectionText}>
            Impacted categories:{' '}
            {(summary.categoriesImpacted || []).join(', ') || 'None'}
          </Text>
        </View>

        {topRecommendations.length > 0 && (
          <View style={styles.recommendations}>
            <Text style={styles.recommendationsTitle}>Top Recommendations</Text>
            {topRecommendations.map(item => (
              <View key={item.sku} style={styles.recommendationCard}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationName}>{item.name}</Text>
                  <Text
                    style={[
                      styles.priorityBadge,
                      item.priority === 'Critical' && styles.priorityCritical,
                      item.priority === 'High' && styles.priorityHigh,
                    ]}
                  >
                    {item.priority}
                  </Text>
                </View>
                <Text style={styles.recommendationDetail}>
                  Shortfall {item.shortfall} units • Lead time {item.leadTimeDays} days
                </Text>
                <Text style={styles.recommendationLine}>
                  <Text style={styles.recommendationLabel}>Twin: </Text>
                  Product twin for <Text style={styles.inlineStrong}>{item.category}</Text> in this store.
                </Text>
                <Text style={styles.recommendationLine}>
                  <Text style={styles.recommendationLabel}>Agents: </Text>
                  Product Agent (velocity), Store Agent (replenishment), Procurement Agent (PO),
                  Risk Agent (spikes).
                </Text>
                <Text style={styles.recommendationLine}>
                  <Text style={styles.recommendationLabel}>Outcome: </Text>
                  {item.action} to avoid lost sales and stabilize service level.
                </Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.secondaryButton} onPress={onStart}>
          <Ionicons name="refresh" size={16} color="#1E40AF" />
          <Text style={styles.secondaryButtonText}>Re-run analysis</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#EEF2FF']}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardTitle}>Smart Demand Analysis</Text>
            <Text style={styles.cardSubtitle}>
              Demo run inside the device – no backend required
            </Text>
          </View>
          <Animated.View
            style={[
              styles.statusBadge,
              {
                backgroundColor: currentStatusStyle.color,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: currentStatusStyle.text },
              ]}
            >
              {currentStatusStyle.label}
            </Text>
          </Animated.View>
        </View>
        {status === 'idle' && renderIdle()}
        {status === 'running' && renderRunning()}
        {status === 'completed' && renderResults()}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#4B5563',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionBody: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
  },
  sectionText: {
    fontSize: 13,
    color: '#1F2937',
    lineHeight: 18,
  },
  primaryButton: {
    marginTop: 12,
  },
  primaryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  runningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  stepLabel: {
    fontSize: 13,
    color: '#475569',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBlock: {
    flex: 1,
    paddingHorizontal: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  summaryDetails: {
    gap: 6,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  riskBadgeText: {
    fontSize: 12,
    color: '#B45309',
    fontWeight: '600',
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
  },
  recommendations: {
    gap: 8,
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  recommendationName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    fontWeight: '700',
  },
  priorityCritical: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
  },
  priorityHigh: {
    backgroundColor: '#FFEDD5',
    color: '#C2410C',
  },
  recommendationDetail: {
    fontSize: 12,
    color: '#475569',
  },
  recommendationAction: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E0E7FF',
  },
  secondaryButtonText: {
    color: '#1E40AF',
    fontWeight: '600',
  },
});

export default AnalysisPanel;

