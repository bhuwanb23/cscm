import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SkuTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>SKU Performance Intelligence</Text>
        <Text style={styles.description}>
          Deep dive into SKU lifecycle, performance metrics, and variant-level analytics
        </Text>
      </View>
      
      {/* SKU Digital Twins */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>SKU Digital Twins</Text>
        <View style={styles.twinGrid}>
          <View style={styles.twinItem}>
            <View style={styles.twinHeader}>
              <Text style={styles.skuName}>SKU A123 - Summer Dress</Text>
              <View style={styles.twinStatus}>
                <View style={[styles.statusIndicator, styles.statusActive]} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <Text style={styles.twinDetail}>Digital twin sync: 98% accuracy</Text>
            <Text style={styles.twinDetail}>Last updated: 2 hours ago</Text>
          </View>
          <View style={styles.twinItem}>
            <View style={styles.twinHeader}>
              <Text style={styles.skuName}>SKU B456 - Casual Tee</Text>
              <View style={styles.twinStatus}>
                <View style={[styles.statusIndicator, styles.statusActive]} />
                <Text style={styles.statusText}>Active</Text>
              </View>
            </View>
            <Text style={styles.twinDetail}>Digital twin sync: 95% accuracy</Text>
            <Text style={styles.twinDetail}>Last updated: 4 hours ago</Text>
          </View>
        </View>
      </View>
      
      {/* Lifecycle Stage */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Lifecycle Stage Classification</Text>
        <View style={styles.lifecycleGrid}>
          <View style={styles.lifecycleItem}>
            <View style={[styles.stageBadge, styles.stageNew]}>
              <Text style={styles.stageText}>New</Text>
            </View>
            <Text style={styles.stageCount}>24 SKUs</Text>
            <Text style={styles.stageDescription}>Launched in last 30 days</Text>
          </View>
          <View style={styles.lifecycleItem}>
            <View style={[styles.stageBadge, styles.stageGrowth]}>
              <Text style={styles.stageText}>Growth</Text>
            </View>
            <Text style={styles.stageCount}>67 SKUs</Text>
            <Text style={styles.stageDescription}>Increasing sales trend</Text>
          </View>
          <View style={styles.lifecycleItem}>
            <View style={[styles.stageBadge, styles.stagePeak]}>
              <Text style={styles.stageText}>Peak</Text>
            </View>
            <Text style={styles.stageCount}>42 SKUs</Text>
            <Text style={styles.stageDescription}>Maximum sales period</Text>
          </View>
          <View style={styles.lifecycleItem}>
            <View style={[styles.stageBadge, styles.stageDecline]}>
              <Text style={styles.stageText}>Decline</Text>
            </View>
            <Text style={styles.stageCount}>18 SKUs</Text>
            <Text style={styles.stageDescription}>Decreasing sales trend</Text>
          </View>
        </View>
      </View>
      
      {/* Style-level Performance */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Style-level Performance</Text>
        <View style={styles.performanceTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Style</Text>
            <Text style={styles.headerCell}>Sales</Text>
            <Text style={styles.headerCell}>Growth</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.rowCell}>Summer Dress</Text>
            <Text style={styles.rowCell}>1,245 units</Text>
            <Text style={[styles.rowCell, styles.growthPositive]}>↑ 24%</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.rowCell}>Casual Tee</Text>
            <Text style={styles.rowCell}>892 units</Text>
            <Text style={[styles.rowCell, styles.growthPositive]}>↑ 18%</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.rowCell}>Denim Jacket</Text>
            <Text style={styles.rowCell}>654 units</Text>
            <Text style={[styles.rowCell, styles.growthNegative]}>↓ 8%</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.rowCell}>Party Wear</Text>
            <Text style={styles.rowCell}>432 units</Text>
            <Text style={[styles.rowCell, styles.growthNegative]}>↓ 15%</Text>
          </View>
        </View>
      </View>
      
      {/* Margin Contribution Score */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Margin Contribution Score</Text>
        <View style={styles.marginChart}>
          <View style={styles.chartRow}>
            <Text style={styles.skuLabel}>SKU A123</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '85%', backgroundColor: '#10B981' }]} />
              <Text style={styles.chartValue}>85%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.skuLabel}>SKU B456</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '72%', backgroundColor: '#3B82F6' }]} />
              <Text style={styles.chartValue}>72%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.skuLabel}>SKU C789</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '68%', backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.chartValue}>68%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.skuLabel}>SKU D012</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '45%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.chartValue}>45%</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Sell-through Heatmaps */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Sell-through Heatmaps</Text>
        <View style={styles.heatmapContainer}>
          <View style={styles.heatmapRow}>
            <Text style={styles.storeName}>Store 1</Text>
            <View style={styles.heatmapDots}>
              <View style={[styles.heatmapDot, styles.dotHigh]} />
              <View style={[styles.heatmapDot, styles.dotHigh]} />
              <View style={[styles.heatmapDot, styles.dotMedium]} />
              <View style={[styles.heatmapDot, styles.dotLow]} />
              <View style={[styles.heatmapDot, styles.dotLow]} />
            </View>
          </View>
          <View style={styles.heatmapRow}>
            <Text style={styles.storeName}>Store 2</Text>
            <View style={styles.heatmapDots}>
              <View style={[styles.heatmapDot, styles.dotMedium]} />
              <View style={[styles.heatmapDot, styles.dotHigh]} />
              <View style={[styles.heatmapDot, styles.dotHigh]} />
              <View style={[styles.heatmapDot, styles.dotMedium]} />
              <View style={[styles.heatmapDot, styles.dotLow]} />
            </View>
          </View>
          <View style={styles.heatmapRow}>
            <Text style={styles.storeName}>Store 3</Text>
            <View style={styles.heatmapDots}>
              <View style={[styles.heatmapDot, styles.dotLow]} />
              <View style={[styles.heatmapDot, styles.dotMedium]} />
              <View style={[styles.heatmapDot, styles.dotMedium]} />
              <View style={[styles.heatmapDot, styles.dotHigh]} />
              <View style={[styles.heatmapDot, styles.dotHigh]} />
            </View>
          </View>
          <View style={styles.heatmapLegend}>
            <Text style={styles.legendText}>Low</Text>
            <View style={[styles.legendDot, styles.dotLow]} />
            <View style={[styles.legendDot, styles.dotMedium]} />
            <View style={[styles.legendDot, styles.dotHigh]} />
            <Text style={styles.legendText}>High</Text>
          </View>
        </View>
      </View>
      
      {/* Return Rate Analytics */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Return Rate Analytics</Text>
        <View style={styles.returnAnalysis}>
          <View style={styles.returnItem}>
            <View style={styles.returnHeader}>
              <Text style={styles.skuName}>SKU X123 - Summer Dress</Text>
              <Text style={styles.returnRate}>12%</Text>
            </View>
            <Text style={styles.returnDetail}>70% sell-through rate</Text>
            <Text style={styles.returnReason}>Size mismatch complaints</Text>
          </View>
          <View style={styles.returnItem}>
            <View style={styles.returnHeader}>
              <Text style={styles.skuName}>SKU Y456 - Casual Tee</Text>
              <Text style={[styles.returnRate, styles.rateHigh]}>18%</Text>
            </View>
            <Text style={styles.returnDetail}>55% sell-through rate</Text>
            <Text style={styles.returnReason}>Quality-related returns</Text>
          </View>
        </View>
      </View>
      
      {/* AI Actions */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>AI-Powered Recommendations</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="refresh" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>SKU X has 70% sell-through and should be reordered</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.bulletText}>SKU Y has 18% return rate — quality check needed</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-up" size={16} color="#10B981" />
            <Text style={styles.bulletText}>SKU A123 in Growth stage - increase marketing budget by 15%</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-down" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>SKU B456 entering Decline stage - consider discount strategy</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SkuTab;

const styles = StyleSheet.create({
  container: {
    // Removed padding to prevent pushing navbar up
  },
  section: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  fullCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  // SKU Digital Twins styles
  twinGrid: {
    gap: 12,
  },
  twinItem: {
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  twinHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skuName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  twinStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  twinDetail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  // Lifecycle styles
  lifecycleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  lifecycleItem: {
    width: '48%',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  stageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 8,
  },
  stageNew: {
    backgroundColor: '#DBEAFE',
  },
  stageGrowth: {
    backgroundColor: '#D1FAE5',
  },
  stagePeak: {
    backgroundColor: '#FEF3C7',
  },
  stageDecline: {
    backgroundColor: '#FEE2E2',
  },
  stageText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stageCount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  stageDescription: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  // Performance styles
  performanceTable: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerCell: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowCell: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  growthPositive: {
    color: '#10B981',
    fontWeight: '600',
  },
  growthNegative: {
    color: '#EF4444',
    fontWeight: '600',
  },
  // Margin styles
  marginChart: {
    marginTop: 10,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skuLabel: {
    width: 80,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  chartBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartBar: {
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  chartValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    minWidth: 40,
  },
  // Heatmap styles
  heatmapContainer: {
    marginTop: 10,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  storeName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    width: 60,
  },
  heatmapDots: {
    flexDirection: 'row',
    gap: 8,
  },
  heatmapDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dotLow: {
    backgroundColor: '#10B981',
  },
  dotMedium: {
    backgroundColor: '#F59E0B',
  },
  dotHigh: {
    backgroundColor: '#EF4444',
  },
  heatmapLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // Return rate styles
  returnAnalysis: {
    gap: 12,
  },
  returnItem: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  returnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  returnRate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
  },
  rateHigh: {
    color: '#EF4444',
  },
  returnDetail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  returnReason: {
    fontSize: 12,
    color: '#94A3B8',
  },
  // Bullet list styles
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
});