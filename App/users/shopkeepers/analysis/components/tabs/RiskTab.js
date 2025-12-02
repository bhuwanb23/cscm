import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RiskTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Risk & Alerts Center</Text>
        <Text style={styles.description}>
          Proactive monitoring of supply chain risks and automated alerting system
        </Text>
      </View>
      
      {/* Risk Dashboard */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Risk Dashboard</Text>
        <View style={styles.riskSummary}>
          <View style={styles.riskMetric}>
            <View style={styles.metricHeader}>
              <Ionicons name="warning" size={20} color="#EF4444" />
              <Text style={styles.metricLabel}>Critical Risks</Text>
            </View>
            <Text style={styles.metricValue}>12</Text>
            <Text style={styles.metricTrend}>↑ 3 from yesterday</Text>
          </View>
          <View style={styles.riskMetric}>
            <View style={styles.metricHeader}>
              <Ionicons name="alert" size={20} color="#F59E0B" />
              <Text style={styles.metricLabel}>High Risks</Text>
            </View>
            <Text style={styles.metricValue}>28</Text>
            <Text style={styles.metricTrend}>↑ 5 from yesterday</Text>
          </View>
          <View style={styles.riskMetric}>
            <View style={styles.metricHeader}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.metricLabel}>Medium Risks</Text>
            </View>
            <Text style={styles.metricValue}>45</Text>
            <Text style={styles.metricTrend}>↓ 2 from yesterday</Text>
          </View>
        </View>
      </View>
      
      {/* Stockout Risk */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Stockout Risk</Text>
        <View style={styles.riskList}>
          <View style={styles.riskItem}>
            <View style={styles.riskHeader}>
              <Text style={styles.skuName}>SKU A123 - Summer Dress</Text>
              <View style={styles.riskSeverity}>
                <View style={[styles.severityIndicator, styles.severityHigh]} />
                <Text style={styles.severityText}>High</Text>
              </View>
            </View>
            <Text style={styles.riskDetail}>Current stock: 45 units</Text>
            <Text style={styles.riskDetail}>Predicted OOS in: 3 days</Text>
            <Text style={styles.riskLocation}>Store 2, Warehouse B</Text>
          </View>
          <View style={styles.riskItem}>
            <View style={styles.riskHeader}>
              <Text style={styles.skuName}>SKU B456 - Casual Tee</Text>
              <View style={styles.riskSeverity}>
                <View style={[styles.severityIndicator, styles.severityMedium]} />
                <Text style={styles.severityText}>Medium</Text>
              </View>
            </View>
            <Text style={styles.riskDetail}>Current stock: 78 units</Text>
            <Text style={styles.riskDetail}>Predicted OOS in: 7 days</Text>
            <Text style={styles.riskLocation}>Store 1, Store 3</Text>
          </View>
        </View>
      </View>
      
      {/* Overstock Risk */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Overstock Risk</Text>
        <View style={styles.riskList}>
          <View style={styles.riskItem}>
            <View style={styles.riskHeader}>
              <Text style={styles.skuName}>SKU C789 - Winter Coat</Text>
              <View style={styles.riskSeverity}>
                <View style={[styles.severityIndicator, styles.severityHigh]} />
                <Text style={styles.severityText}>High</Text>
              </View>
            </View>
            <Text style={styles.riskDetail}>Current stock: 342 units</Text>
            <Text style={styles.riskDetail}>90+ days old: 187 units</Text>
            <Text style={styles.riskLocation}>Warehouse A, Store 4</Text>
          </View>
          <View style={styles.riskItem}>
            <View style={styles.riskHeader}>
              <Text style={styles.skuName}>SKU D012 - Party Wear</Text>
              <View style={styles.riskSeverity}>
                <View style={[styles.severityIndicator, styles.severityMedium]} />
                <Text style={styles.severityText}>Medium</Text>
              </View>
            </View>
            <Text style={styles.riskDetail}>Current stock: 156 units</Text>
            <Text style={styles.riskDetail}>60+ days old: 98 units</Text>
            <Text style={styles.riskLocation}>Store 2, Store 5</Text>
          </View>
        </View>
      </View>
      
      {/* Ageing Inventory */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Ageing Inventory</Text>
        <View style={styles.ageingChart}>
          <View style={styles.chartRow}>
            <Text style={styles.ageingLabel}>0-30 Days</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '75%', backgroundColor: '#10B981' }]} />
              <Text style={styles.chartValue}>65%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.ageingLabel}>31-60 Days</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '15%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.chartValue}>12%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.ageingLabel}>61-90 Days</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '7%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.chartValue}>7%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.ageingLabel}>90+ Days</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '3%', backgroundColor: '#EF4444' }]} />
              <Text style={styles.chartValue}>3%</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Vendor Delay Risk */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Vendor Delay Risk</Text>
        <View style={styles.vendorRiskList}>
          <View style={styles.vendorRiskItem}>
            <View style={styles.vendorHeader}>
              <Text style={styles.vendorName}>ABC Textiles</Text>
              <View style={styles.delaySeverity}>
                <View style={[styles.severityIndicator, styles.severityMedium]} />
                <Text style={styles.severityText}>Medium</Text>
              </View>
            </View>
            <Text style={styles.vendorDetail}>Avg. delay: 2.3 days</Text>
            <Text style={styles.vendorDetail}>OTIF score: 87%</Text>
            <Text style={styles.vendorImpact}>Affects 12 SKUs</Text>
          </View>
          <View style={styles.vendorRiskItem}>
            <View style={styles.vendorHeader}>
              <Text style={styles.vendorName}>XYZ Fabrics</Text>
              <View style={styles.delaySeverity}>
                <View style={[styles.severityIndicator, styles.severityHigh]} />
                <Text style={styles.severityText}>High</Text>
              </View>
            </View>
            <Text style={styles.vendorDetail}>Avg. delay: 4.7 days</Text>
            <Text style={styles.vendorDetail}>OTIF score: 72%</Text>
            <Text style={styles.vendorImpact}>Affects 8 SKUs</Text>
          </View>
        </View>
      </View>
      
      {/* API Sync Failures */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>API Sync Failures</Text>
        <View style={styles.apiFailures}>
          <View style={styles.apiItem}>
            <View style={styles.apiHeader}>
              <Text style={styles.apiName}>Shopify API</Text>
              <View style={styles.apiStatus}>
                <View style={[styles.statusIndicator, styles.statusWarning]} />
                <Text style={styles.statusText}>Intermittent</Text>
              </View>
            </View>
            <Text style={styles.apiDetail}>Failed syncs: 12 in last 24h</Text>
            <Text style={styles.apiDetail}>Last failure: 2 hours ago</Text>
          </View>
          <View style={styles.apiItem}>
            <View style={styles.apiHeader}>
              <Text style={styles.apiName}>Meesho API</Text>
              <View style={styles.apiStatus}>
                <View style={[styles.statusIndicator, styles.statusCritical]} />
                <Text style={styles.statusText}>Critical</Text>
              </View>
            </View>
            <Text style={styles.apiDetail}>Failed syncs: 45 in last 24h</Text>
            <Text style={styles.apiDetail}>Last failure: 30 mins ago</Text>
          </View>
        </View>
      </View>
      
      {/* SKU Tampering Risk */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>SKU Tampering Risk</Text>
        <View style={styles.tamperingList}>
          <View style={styles.tamperingItem}>
            <View style={styles.tamperingHeader}>
              <Text style={styles.skuName}>SKU X123</Text>
              <View style={styles.tamperingSeverity}>
                <View style={[styles.severityIndicator, styles.severityHigh]} />
                <Text style={styles.severityText}>High</Text>
              </View>
            </View>
            <Text style={styles.tamperingDetail}>Unauthorized price changes detected</Text>
            <Text style={styles.tamperingDetail}>3rd party marketplace discrepancy</Text>
          </View>
        </View>
      </View>
      
      {/* Seasonal Spike Warning */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Seasonal Spike Warnings</Text>
        <View style={styles.seasonalWarnings}>
          <View style={styles.seasonalItem}>
            <View style={styles.seasonalHeader}>
              <Text style={styles.eventName}>Puja Fest</Text>
              <View style={styles.eventStatus}>
                <View style={[styles.statusIndicator, styles.statusUpcoming]} />
                <Text style={styles.statusText}>Upcoming</Text>
              </View>
            </View>
            <Text style={styles.eventDetail}>Expected sales increase: 2.1x</Text>
            <Text style={styles.eventDetail}>Duration: Oct 12-16</Text>
            <Text style={styles.eventSKUs}>Affected SKUs: 24</Text>
          </View>
          <View style={styles.seasonalItem}>
            <View style={styles.seasonalHeader}>
              <Text style={styles.eventName}>Winter Collection Launch</Text>
              <View style={styles.eventStatus}>
                <View style={[styles.statusIndicator, styles.statusUpcoming]} />
                <Text style={styles.statusText}>Planned</Text>
              </View>
            </View>
            <Text style={styles.eventDetail}>Expected sales increase: 1.8x</Text>
            <Text style={styles.eventDetail}>Duration: Nov 1-30</Text>
            <Text style={styles.eventSKUs}>Affected SKUs: 18</Text>
          </View>
        </View>
      </View>
      
      {/* Logistics Bottlenecks */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Logistics Bottlenecks</Text>
        <View style={styles.logisticsList}>
          <View style={styles.logisticsItem}>
            <View style={styles.logisticsHeader}>
              <Text style={styles.routeName}>Warehouse A → Store 3</Text>
              <View style={styles.logisticsSeverity}>
                <View style={[styles.severityIndicator, styles.severityMedium]} />
                <Text style={styles.severityText}>Medium</Text>
              </View>
            </View>
            <Text style={styles.logisticsDetail}>Avg. delivery time: 3.2 days (expected: 2 days)</Text>
            <Text style={styles.logisticsDetail}>Caused by traffic congestion</Text>
          </View>
        </View>
      </View>
      
      {/* Sales Dip Early Warnings */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Sales Dip Early Warnings</Text>
        <View style={styles.salesDips}>
          <View style={styles.salesDipItem}>
            <View style={styles.salesDipHeader}>
              <Text style={styles.skuName}>SKU Y456 - Formal Shirt</Text>
              <View style={styles.dipSeverity}>
                <View style={[styles.severityIndicator, styles.severityMedium]} />
                <Text style={styles.severityText}>Medium</Text>
              </View>
            </View>
            <Text style={styles.salesDipDetail}>Sales down 28% vs last week</Text>
            <Text style={styles.salesDipDetail}>Trend: Consistently declining</Text>
          </View>
        </View>
      </View>
      
      {/* AI Actions */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>AI-Powered Recommendations</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.bulletText}>Material shortage predicted in next 14 days</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-up" size={16} color="#10B981" />
            <Text style={styles.bulletText}>Sales expected to spike 2.1x during Puja Fest</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="refresh" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>Initiate emergency procurement for SKU A123 to prevent stockout</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="pricetag" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>Apply 20% discount on Winter Coats to reduce overstock</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default RiskTab;

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
  // Risk summary styles
  riskSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  riskMetric: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginVertical: 4,
  },
  metricTrend: {
    fontSize: 11,
    color: '#94A3B8',
  },
  // Risk list styles
  riskList: {
    gap: 12,
  },
  riskItem: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skuName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  riskSeverity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  severityIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  severityHigh: {
    backgroundColor: '#EF4444',
  },
  severityMedium: {
    backgroundColor: '#F59E0B',
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  riskDetail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  riskLocation: {
    fontSize: 11,
    color: '#94A3B8',
  },
  // Ageing chart styles
  ageingChart: {
    marginTop: 10,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ageingLabel: {
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
  // Vendor risk styles
  vendorRiskList: {
    gap: 12,
  },
  vendorRiskItem: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  vendorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  vendorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  delaySeverity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vendorDetail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  vendorImpact: {
    fontSize: 11,
    color: '#94A3B8',
  },
  // API failures styles
  apiFailures: {
    gap: 12,
  },
  apiItem: {
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  apiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  apiName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  apiStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusWarning: {
    backgroundColor: '#F59E0B',
  },
  statusCritical: {
    backgroundColor: '#EF4444',
  },
  statusUpcoming: {
    backgroundColor: '#3B82F6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  apiDetail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  // Tampering styles
  tamperingList: {
    gap: 12,
  },
  tamperingItem: {
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  tamperingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tamperingDetail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  // Seasonal warnings styles
  seasonalWarnings: {
    gap: 12,
  },
  seasonalItem: {
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  seasonalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  eventName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  eventStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  eventDetail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  eventSKUs: {
    fontSize: 11,
    color: '#94A3B8',
  },
  // Logistics styles
  logisticsList: {
    gap: 12,
  },
  logisticsItem: {
    padding: 12,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  logisticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  routeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  logisticsSeverity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logisticsDetail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  // Sales dip styles
  salesDips: {
    gap: 12,
  },
  salesDipItem: {
    padding: 12,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  salesDipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  salesDipDetail: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
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