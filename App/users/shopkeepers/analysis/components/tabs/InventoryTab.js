import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InventoryTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Inventory Health Dashboard</Text>
        <Text style={styles.description}>
          Live view of all SKUs by node, with low-stock and excess-stock heat overlays
        </Text>
      </View>
      
      {/* Inventory Overview Metrics */}
      <View style={styles.contentRow}>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Inventory Value</Text>
          <Text style={styles.metricLarge}>₹45.2L</Text>
          <Text style={styles.trendTextPositive}>↑ 12% from last month</Text>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Stockout Risk</Text>
          <Text style={styles.metricLarge}>18%</Text>
          <Text style={styles.trendTextNegative}>↑ 3% from last month</Text>
        </View>
      </View>
      
      <View style={styles.contentRow}>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Overstock Value</Text>
          <Text style={styles.metricLarge}>₹24.5L</Text>
          <Text style={styles.trendTextNegative}>↓ 5% from last month</Text>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>SKU Health Score</Text>
          <Text style={styles.metricLarge}>82/100</Text>
          <Text style={styles.trendTextPositive}>↑ 2 points from last month</Text>
        </View>
      </View>
      
      {/* Inventory Distribution Chart */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Inventory Distribution by Category</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Tops</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '75%', backgroundColor: '#3B82F6' }]} />
              <Text style={styles.chartValue}>₹12.4L</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Bottoms</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '60%', backgroundColor: '#10B981' }]} />
              <Text style={styles.chartValue}>₹9.8L</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Dresses</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '45%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.chartValue}>₹7.3L</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Accessories</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '30%', backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.chartValue}>₹4.2L</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Heat Maps */}
      <View style={styles.contentRow}>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Low-stock SKUs Heat Map</Text>
          <View style={styles.heatmapContainer}>
            <View style={styles.heatmapRow}>
              <Text style={styles.heatmapLabel}>Store A</Text>
              <View style={styles.heatmapDots}>
                <View style={[styles.heatmapDot, styles.heatmapDotHigh]} />
                <View style={[styles.heatmapDot, styles.heatmapDotMedium]} />
                <View style={[styles.heatmapDot, styles.heatmapDotLow]} />
              </View>
            </View>
            <View style={styles.heatmapRow}>
              <Text style={styles.heatmapLabel}>Store B</Text>
              <View style={styles.heatmapDots}>
                <View style={[styles.heatmapDot, styles.heatmapDotMedium]} />
                <View style={[styles.heatmapDot, styles.heatmapDotLow]} />
                <View style={[styles.heatmapDot, styles.heatmapDotHigh]} />
              </View>
            </View>
            <View style={styles.heatmapRow}>
              <Text style={styles.heatmapLabel}>Store C</Text>
              <View style={styles.heatmapDots}>
                <View style={[styles.heatmapDot, styles.heatmapDotLow]} />
                <View style={[styles.heatmapDot, styles.heatmapDotHigh]} />
                <View style={[styles.heatmapDot, styles.heatmapDotMedium]} />
              </View>
            </View>
          </View>
          <Text style={styles.heatmapLegend}>Risk Level: Low ● Medium ● High</Text>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Excess-stock SKUs Heat Map</Text>
          <View style={styles.heatmapContainer}>
            <View style={styles.heatmapRow}>
              <Text style={styles.heatmapLabel}>Store A</Text>
              <View style={styles.heatmapDots}>
                <View style={[styles.heatmapDot, styles.heatmapDotLow]} />
                <View style={[styles.heatmapDot, styles.heatmapDotHigh]} />
                <View style={[styles.heatmapDot, styles.heatmapDotMedium]} />
              </View>
            </View>
            <View style={styles.heatmapRow}>
              <Text style={styles.heatmapLabel}>Store B</Text>
              <View style={styles.heatmapDots}>
                <View style={[styles.heatmapDot, styles.heatmapDotHigh]} />
                <View style={[styles.heatmapDot, styles.heatmapDotLow]} />
                <View style={[styles.heatmapDot, styles.heatmapDotLow]} />
              </View>
            </View>
            <View style={styles.heatmapRow}>
              <Text style={styles.heatmapLabel}>Store C</Text>
              <View style={styles.heatmapDots}>
                <View style={[styles.heatmapDot, styles.heatmapDotMedium]} />
                <View style={[styles.heatmapDot, styles.heatmapDotMedium]} />
                <View style={[styles.heatmapDot, styles.heatmapDotHigh]} />
              </View>
            </View>
          </View>
          <Text style={styles.heatmapLegend}>Risk Level: Low ● Medium ● High</Text>
        </View>
      </View>
      
      {/* Ageing Inventory */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Ageing Inventory Analysis</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>0-30 Days</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '80%', backgroundColor: '#10B981' }]} />
              <Text style={styles.chartValue}>65%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>31-60 Days</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '15%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.chartValue}>12%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>61-90 Days</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '4%', backgroundColor: '#EF4444' }]} />
              <Text style={styles.chartValue}>4%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>90+ Days</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '1%', backgroundColor: '#991B1B' }]} />
              <Text style={styles.chartValue}>1%</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* SKU Velocity */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>SKU Velocity Distribution</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Fast Movers</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '40%', backgroundColor: '#10B981' }]} />
              <Text style={styles.chartValue}>40%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Medium Movers</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '35%', backgroundColor: '#3B82F6' }]} />
              <Text style={styles.chartValue}>35%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Slow Movers</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '25%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.chartValue}>25%</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* AI Actions */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>AI-Powered Recommendations</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.bulletText}>SKU X123 (Tops) predicted to go OOS in 7 days at Store A</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>Transfer 20 units of SKU Y456 (Dresses) from Store C to Store B</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="pricetag" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>Mark 15 slow-moving SKUs for 30% discount sale</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="time" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>43 SKUs ageing beyond 90 days in Warehouse - review required</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default InventoryTab;

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
  contentRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
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
  metricLarge: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginVertical: 8,
  },
  trendTextPositive: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  trendTextNegative: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
  },
  chartContainer: {
    marginTop: 10,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartLabel: {
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
  // Heat map styles
  heatmapContainer: {
    marginTop: 10,
  },
  heatmapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heatmapLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
    width: 60,
  },
  heatmapDots: {
    flexDirection: 'row',
    gap: 8,
  },
  heatmapDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  heatmapDotLow: {
    backgroundColor: '#10B981',
  },
  heatmapDotMedium: {
    backgroundColor: '#F59E0B',
  },
  heatmapDotHigh: {
    backgroundColor: '#EF4444',
  },
  heatmapLegend: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 5,
  },
});