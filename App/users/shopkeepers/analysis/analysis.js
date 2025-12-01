import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const MODULES = [
  { id: 'inventory', label: 'Inventory Mesh' },
  { id: 'forecast', label: 'Demand Forecast' },
  { id: 'risk', label: 'Risk Engine' },
  { id: 'rebalancing', label: 'Rebalancing Simulation' },
  { id: 'procurement', label: 'Procurement Planning' },
];

const TABS = [
  'Inventory Health',
  'Demand Forecast',
  'Rebalancing',
  'Channel Sync',
  'SKU Intelligence',
  'Procurement',
  'Risk & Alerts',
  'Digital Twins Explorer',
];

const Analysis = () => {
  const [status, setStatus] = useState('idle'); // idle | running | done
  const [activeTab, setActiveTab] = useState('Inventory Health');
  const [metrics, setMetrics] = useState({
    stockoutRisk: 18,
    overstockValue: 24.5,
    revenueLost: 3.2,
    skuHealth: 82,
    forecastAccuracy: 91,
    workingCapital: 47.3,
    demandSpikes: 6,
    inventoryTurnover: 9.1,
    transferGain: 1.4,
  });
  const [moduleProgress, setModuleProgress] = useState(
    MODULES.reduce((acc, m) => ({ ...acc, [m.id]: 0 }), {}),
  );
  const [insights, setInsights] = useState([]);

  const runAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(runAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(runAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      runAnim.stopAnimation();
      runAnim.setValue(0);
    }
  }, [status, runAnim]);

  const startAnalysis = () => {
    if (status === 'running') return;

    setStatus('running');
    setModuleProgress(MODULES.reduce((acc, m) => ({ ...acc, [m.id]: 3 }), {}));
    setInsights([]);

    MODULES.forEach((m, index) => {
      setTimeout(() => {
        setModuleProgress(prev => ({
          ...prev,
          [m.id]: 100,
        }));
      }, 800 * (index + 1));
    });

    setTimeout(() => {
      setMetrics({
        stockoutRisk: 21,
        overstockValue: 26.9,
        revenueLost: 2.7,
        skuHealth: 84,
        forecastAccuracy: 92,
        workingCapital: 45.1,
        demandSpikes: 8,
        inventoryTurnover: 9.4,
        transferGain: 1.9,
      });
      setInsights([
        'SKU X is selling 3x faster in Bangalore; transfer 20 units from Chennai.',
        'Weekend spike of 2.1x expected on beverages; increase PO by 18%.',
        'Ageing inventory in Warehouse B: 43 SKUs beyond 90 days.',
        '16 SKUs not synced across D2C, Meesho, Amazon – channel risk.',
      ]);
      setStatus('done');
    }, 800 * (MODULES.length + 2));
  };

  const runScale = runAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.03],
  });

  const renderMetricCard = (label, value, suffix, color) => (
    <View style={styles.metricCard} key={label}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, color && { color }]}>
        {value}
        {suffix}
      </Text>
    </View>
  );

  const renderModuleProgress = () => (
    <View style={styles.moduleRow}>
      {MODULES.map(m => (
        <View style={styles.moduleBlock} key={m.id}>
          <View style={styles.moduleHeader}>
            <Text style={styles.moduleLabel}>{m.label}</Text>
            <Text style={styles.modulePercent}>
              {moduleProgress[m.id] || 0}
              %
            </Text>
          </View>
          <View style={styles.moduleBar}>
            <View
              style={[
                styles.moduleFill,
                { width: `${Math.max(moduleProgress[m.id] || 0, 5)}%` },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  );

  const renderTabPill = tab => {
    const isActive = tab === activeTab;
    return (
      <TouchableOpacity
        key={tab}
        style={styles.tabPillWrapper}
        onPress={() => setActiveTab(tab)}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={isActive ? ['#2563EB', '#1E40AF'] : ['#F3F4F6', '#E5E7EB']}
          style={styles.tabPill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
            {tab}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderInventoryTab = () => (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Inventory Health Dashboard</Text>
      <Text style={styles.tabIntro}>
        This view scans the full inventory mesh — across warehouses, stores and channels —
        to highlight risk, opportunity and slow movers.
      </Text>
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inventory Mesh</Text>
          <Text style={styles.cardText}>
            Live view of all SKUs by node, with low‑stock and excess‑stock heat overlays.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SKU Velocity</Text>
          <Text style={styles.cardText}>
            Fast vs slow movers by store, with demand spikes and ageing buckets (30/60/90+ days).
          </Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Actions</Text>
        <Text style={styles.cardBullet}>• Predicts which SKUs will go OOS in the next 7–14 days.</Text>
        <Text style={styles.cardBullet}>• Flags slow‑moving SKUs that should be marked for sale.</Text>
        <Text style={styles.cardBullet}>
          • Highlights store‑to‑store transfers to unlock blocked working capital.
        </Text>
        <Text style={styles.cardBullet}>
          • Surfaces ageing items beyond 90 days for clearance or redistribution.
        </Text>
      </View>
    </View>
  );

  const renderDemandTab = () => (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Demand Forecast Engine</Text>
      <Text style={styles.tabIntro}>
        Predictive curves for the next 7/14/30/60/90 days, with confidence bands and category colors.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Forecast Highlights</Text>
        <Text style={styles.cardBullet}>• Top 10 fast movers by uplift vs last week.</Text>
        <Text style={styles.cardBullet}>• Top 10 slow movers trending to markdown territory.</Text>
        <Text style={styles.cardBullet}>• Region‑wise demand maps to align supply with consumption.</Text>
        <Text style={styles.cardBullet}>
          • Confidence scores per item so planners know where to rely on AI vs use judgment.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Callouts</Text>
        <Text style={styles.cardBullet}>
          • “X SKUs will face OOS in 7 days if no action is taken.”
        </Text>
        <Text style={styles.cardBullet}>
          • “Y SKUs predicted to spike by 120% this weekend — event / offer detected.”
        </Text>
        <Text style={styles.cardBullet}>
          • “Z SKUs are trending on marketplace channels — check pricing and availability.”
        </Text>
      </View>
    </View>
  );

  const renderRebalancingTab = () => (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Rebalancing & Optimal Allocation</Text>
      <Text style={styles.tabIntro}>
        Suggests how to move stock between stores and warehouses to reduce both stockouts and
        overstock, while respecting truck and route constraints.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Optimization Outputs</Text>
        <Text style={styles.cardBullet}>
          • Store‑to‑store transfers where one store is overstocked and another is at risk.
        </Text>
        <Text style={styles.cardBullet}>
          • Warehouse‑to‑store replenishments that keep service levels above target.
        </Text>
        <Text style={styles.cardBullet}>
          • Estimated cost savings and transfer gain potential (₹) per decision.
        </Text>
        <Text style={styles.cardBullet}>
          • Truck capacity and route feasibility check before recommending moves.
        </Text>
      </View>
    </View>
  );

  const renderChannelTab = () => (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Channel Sync & Availability Mesh</Text>
      <Text style={styles.tabIntro}>
        Keeps D2C, marketplaces and quick‑commerce channels in sync to avoid overselling or fake stock.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Channel Intelligence</Text>
        <Text style={styles.cardBullet}>
          • D2C vs marketplace stock comparison for each SKU and node.
        </Text>
        <Text style={styles.cardBullet}>
          • API sync health indicators to spot stale quantities or outages.
        </Text>
        <Text style={styles.cardBullet}>
          • Fake‑stock detection and overselling risk flags per SKU/channel combination.
        </Text>
        <Text style={styles.cardBullet}>
          • Quick‑commerce readiness score based on proximity and freshness.
        </Text>
      </View>
    </View>
  );

  const renderSkuTab = () => (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>SKU Performance Intelligence</Text>
      <Text style={styles.tabIntro}>
        Digital twin view for every SKU, including lifecycle stage, margin, returns and sell‑through.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lifecycle & Performance</Text>
        <Text style={styles.cardBullet}>• Stage classification: New / Growth / Peak / Decline.</Text>
        <Text style={styles.cardBullet}>
          • Style‑level and variant‑level performance to avoid blind reorders.
        </Text>
        <Text style={styles.cardBullet}>
          • Margin contribution and sell‑through heatmaps by store/region.
        </Text>
        <Text style={styles.cardBullet}>
          • Return‑rate analytics to trigger quality investigations.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Actions</Text>
        <Text style={styles.cardBullet}>
          • “SKU X has 70% sell‑through and should be reordered.”
        </Text>
        <Text style={styles.cardBullet}>
          • “SKU Y has 18% return rate — quality check and supplier review needed.”
        </Text>
      </View>
    </View>
  );

  const renderProcurementTab = () => (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Procurement Simulation</Text>
      <Text style={styles.tabIntro}>
        Simulates POs under different demand and vendor lead‑time scenarios, with budget impact.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Procurement Signals</Text>
        <Text style={styles.cardBullet}>• Vendor‑wise lead times and reliability scores.</Text>
        <Text style={styles.cardBullet}>
          • Recommended PO quantities balancing MOQ vs forecast demand.
        </Text>
        <Text style={styles.cardBullet}>
          • Fabric / yarn / material demand forecast for upstream planning.
        </Text>
        <Text style={styles.cardBullet}>
          • Budget impact simulation when PO levels are increased or decreased.
        </Text>
      </View>
    </View>
  );

  const renderRiskTab = () => (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Risk & Alerts Center</Text>
      <Text style={styles.tabIntro}>
        A single place where all risk signals converge — stock, vendor, logistics, API and demand.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Risk Types Monitored</Text>
        <Text style={styles.cardBullet}>• Stockout and overstock risk per SKU/node.</Text>
        <Text style={styles.cardBullet}>• Ageing inventory and write‑off exposure.</Text>
        <Text style={styles.cardBullet}>• Vendor delay probabilities and OTIF risk.</Text>
        <Text style={styles.cardBullet}>• API sync failures and SKU tampering risk.</Text>
        <Text style={styles.cardBullet}>
          • Seasonal spike warnings and early sales‑dip alerts.
        </Text>
      </View>
    </View>
  );

  const renderTwinsTab = () => (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Digital Twin Explorer (Preview)</Text>
      <Text style={styles.tabIntro}>
        Future‑facing view of your virtual supply chain — product, store, region and warehouse twins.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Example Simulations</Text>
        <Text style={styles.cardBullet}>
          • “If we increase production by 20%, which nodes saturate first?”
        </Text>
        <Text style={styles.cardBullet}>
          • “If Store A closes for 5 days, what is the revenue and service‑level impact?”
        </Text>
        <Text style={styles.cardBullet}>
          • “If we get a 2x weekend spike, which SKUs / regions break first?”
        </Text>
      </View>
    </View>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Inventory Health':
        return renderInventoryTab();
      case 'Demand Forecast':
        return renderDemandTab();
      case 'Rebalancing':
        return renderRebalancingTab();
      case 'Channel Sync':
        return renderChannelTab();
      case 'SKU Intelligence':
        return renderSkuTab();
      case 'Procurement':
        return renderProcurementTab();
      case 'Risk & Alerts':
        return renderRiskTab();
      case 'Digital Twins Explorer':
        return renderTwinsTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EBF4FF', '#F8FAFC']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>CSCM Analysis</Text>
          <Text style={styles.headerSubtitle}>
            Central brain of the Cognitive Supply Chain Mesh
          </Text>
        </LinearGradient>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top action bar */}
        <View style={styles.actionBar}>
          <Animated.View style={[styles.runWrapper, { transform: [{ scale: runScale }] }]}>
            <TouchableOpacity
              style={styles.runButtonTouchable}
              onPress={startAnalysis}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#2563EB', '#1E3A8A']}
                style={styles.runButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons
                  name={status === 'running' ? 'flash' : 'play-circle'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.runText}>
                  {status === 'running' ? '⚡ Running AI Analysis…' : 'Run Analysis'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.actionRight}>
            <View style={styles.exportRow}>
              <TouchableOpacity style={styles.exportChip}>
                <Ionicons name="document-text-outline" size={14} color="#111827" />
                <Text style={styles.exportText}>PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportChip}>
                <Ionicons name="grid-outline" size={14} color="#111827" />
                <Text style={styles.exportText}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.exportChip}>
                <Ionicons name="sparkles-outline" size={14} color="#111827" />
                <Text style={styles.exportText}>AI Report</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Filters:</Text>
              <Text style={styles.filterChip}>Last 30 days</Text>
              <Text style={styles.filterChip}>All channels</Text>
              <Text style={styles.filterChip}>All stores</Text>
            </View>
          </View>
        </View>

        {/* Module progress */}
        {renderModuleProgress()}

        {/* Summary metrics row */}
        <View style={styles.metricsRow}>
          {renderMetricCard('Stockout Risk', `${metrics.stockoutRisk}%`, '', '#DC2626')}
          {renderMetricCard('Overstock Value', `₹${metrics.overstockValue.toFixed(1)}L`, '', '#EA580C')}
          {renderMetricCard('Revenue Lost', `₹${metrics.revenueLost.toFixed(1)}L`, '', '#B91C1C')}
          {renderMetricCard('SKU Health Score', metrics.skuHealth, '/100', '#16A34A')}
        </View>
        <View style={styles.metricsRow}>
          {renderMetricCard('Forecast Accuracy', `${metrics.forecastAccuracy}%`, '', '#2563EB')}
          {renderMetricCard('Working Capital Blocked', `₹${metrics.workingCapital.toFixed(1)}L`, '', '#7C3AED')}
          {renderMetricCard('Demand Spike Alerts', metrics.demandSpikes, '', '#F97316')}
          {renderMetricCard('Transfer Gain Potential', `₹${metrics.transferGain.toFixed(1)}L`, '', '#0EA5E9')}
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          {TABS.map(renderTabPill)}
        </ScrollView>

        {/* Main tab content */}
        {renderActiveTab()}

        {/* AI insights feed */}
        <View style={styles.insightsSection}>
          <Text style={styles.insightsTitle}>AI Insights Feed</Text>
          <Text style={styles.insightsIntro}>
            Real‑time narrative of what the mesh is seeing — demand shifts, risks, and recommended moves.
          </Text>
          {(insights.length ? insights : [
            'Run analysis to generate live insights from sample data.',
          ]).map((msg, idx) => (
            <View key={`${idx}-${msg}`} style={styles.insightCard}>
              <View style={styles.insightIconWrap}>
                <Ionicons name="bulb-outline" size={16} color="#FBBF24" />
              </View>
              <View style={styles.insightTextWrap}>
                <Text style={styles.insightLabel}>AI Insight #{idx + 1}</Text>
                <Text style={styles.insightText}>{msg}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#DBEAFE',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-start',
    gap: 12,
  },
  runWrapper: {
    flexShrink: 0,
  },
  runButtonTouchable: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    gap: 8,
  },
  runText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  actionRight: {
    flex: 1,
  },
  exportRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
    marginBottom: 4,
  },
  exportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  exportText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '500',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  filterLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginRight: 4,
  },
  filterChip: {
    fontSize: 11,
    color: '#111827',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  moduleRow: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 4,
  },
  moduleBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  moduleLabel: {
    fontSize: 11,
    color: '#111827',
    fontWeight: '600',
  },
  modulePercent: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '500',
  },
  moduleBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  moduleFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#2563EB',
  },
  metricsRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    flexDirection: 'row',
    gap: 6,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  tabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  tabPillWrapper: {
    marginRight: 6,
  },
  tabPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4B5563',
  },
  tabPillTextActive: {
    color: '#FFFFFF',
  },
  tabSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  tabTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  tabIntro: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  cardBullet: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
  insightsSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  insightsIntro: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  insightIconWrap: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  insightTextWrap: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  insightText: {
    fontSize: 12,
    color: '#111827',
  },
});

export default Analysis;

