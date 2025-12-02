import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProcurementTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Procurement Simulation</Text>
        <Text style={styles.description}>
          Vendor intelligence, PO optimization, and material demand forecasting
        </Text>
      </View>
      
      {/* Vendor Lead Times */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Vendor Lead Times & Reliability</Text>
        <View style={styles.vendorTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.headerCell}>Vendor</Text>
            <Text style={styles.headerCell}>Lead Time</Text>
            <Text style={styles.headerCell}>Reliability</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.vendorName}>ABC Textiles</Text>
            <Text style={styles.leadTime}>7 days</Text>
            <View style={styles.reliabilityContainer}>
              <View style={[styles.reliabilityBar, { width: '92%', backgroundColor: '#10B981' }]} />
              <Text style={styles.reliabilityText}>92%</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.vendorName}>XYZ Fabrics</Text>
            <Text style={styles.leadTime}>12 days</Text>
            <View style={styles.reliabilityContainer}>
              <View style={[styles.reliabilityBar, { width: '78%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.reliabilityText}>78%</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.vendorName}>PQR Materials</Text>
            <Text style={styles.leadTime}>5 days</Text>
            <View style={styles.reliabilityContainer}>
              <View style={[styles.reliabilityBar, { width: '96%', backgroundColor: '#10B981' }]} />
              <Text style={styles.reliabilityText}>96%</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.vendorName}>LMN Suppliers</Text>
            <Text style={styles.leadTime}>15 days</Text>
            <View style={styles.reliabilityContainer}>
              <View style={[styles.reliabilityBar, { width: '65%', backgroundColor: '#EF4444' }]} />
              <Text style={styles.reliabilityText}>65%</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Recommended PO Quantities */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Recommended PO Quantities</Text>
        <View style={styles.poRecommendations}>
          <View style={styles.poItem}>
            <View style={styles.poHeader}>
              <Text style={styles.skuName}>SKU A123 - Summer Dress</Text>
              <Text style={styles.poQuantity}>1,200 units</Text>
            </View>
            <View style={styles.poDetails}>
              <Text style={styles.detailText}>MOQ: 500 units</Text>
              <Text style={styles.detailText}>Demand: 1,150 units</Text>
              <Text style={[styles.detailText, styles.optimized]}>Optimized: +50 units</Text>
            </View>
          </View>
          <View style={styles.poItem}>
            <View style={styles.poHeader}>
              <Text style={styles.skuName}>SKU B456 - Casual Tee</Text>
              <Text style={styles.poQuantity}>800 units</Text>
            </View>
            <View style={styles.poDetails}>
              <Text style={styles.detailText}>MOQ: 300 units</Text>
              <Text style={styles.detailText}>Demand: 750 units</Text>
              <Text style={[styles.detailText, styles.optimized]}>Optimized: +50 units</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* MOQ vs Demand */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>MOQ vs Demand Analysis</Text>
        <View style={styles.moqChart}>
          <View style={styles.chartRow}>
            <Text style={styles.skuLabel}>SKU A123</Text>
            <View style={styles.chartBarsContainer}>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { width: '40%', backgroundColor: '#3B82F6' }]} />
                <Text style={styles.barLabel}>MOQ: 500</Text>
              </View>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { width: '92%', backgroundColor: '#10B981' }]} />
                <Text style={styles.barLabel}>Demand: 1,150</Text>
              </View>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.skuLabel}>SKU B456</Text>
            <View style={styles.chartBarsContainer}>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { width: '24%', backgroundColor: '#3B82F6' }]} />
                <Text style={styles.barLabel}>MOQ: 300</Text>
              </View>
              <View style={styles.chartBarWrapper}>
                <View style={[styles.chartBar, { width: '60%', backgroundColor: '#10B981' }]} />
                <Text style={styles.barLabel}>Demand: 750</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      {/* Predicted Demand-based Ordering */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Predicted Demand-based Ordering</Text>
        <View style={styles.demandForecast}>
          <View style={styles.forecastItem}>
            <Text style={styles.skuName}>SKU A123</Text>
            <View style={styles.forecastDetails}>
              <Text style={styles.currentStock}>Current: 245 units</Text>
              <Text style={styles.predictedDemand}>Predicted: 1,150 units</Text>
              <Text style={styles.reorderPoint}>Reorder at: 150 units</Text>
            </View>
            <View style={styles.actionContainer}>
              <View style={[styles.actionBadge, styles.actionOrder]}>
                <Text style={styles.actionText}>ORDER 905</Text>
              </View>
            </View>
          </View>
          <View style={styles.forecastItem}>
            <Text style={styles.skuName}>SKU B456</Text>
            <View style={styles.forecastDetails}>
              <Text style={styles.currentStock}>Current: 180 units</Text>
              <Text style={styles.predictedDemand}>Predicted: 750 units</Text>
              <Text style={styles.reorderPoint}>Reorder at: 100 units</Text>
            </View>
            <View style={styles.actionContainer}>
              <View style={[styles.actionBadge, styles.actionOrder]}>
                <Text style={styles.actionText}>ORDER 570</Text>
              </View>
            </View>
          </View>
          <View style={styles.forecastItem}>
            <Text style={styles.skuName}>SKU C789</Text>
            <View style={styles.forecastDetails}>
              <Text style={styles.currentStock}>Current: 320 units</Text>
              <Text style={styles.predictedDemand}>Predicted: 280 units</Text>
              <Text style={styles.reorderPoint}>Reorder at: 80 units</Text>
            </View>
            <View style={styles.actionContainer}>
              <View style={[styles.actionBadge, styles.actionHold]}>
                <Text style={styles.actionText}>HOLD</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      {/* Fabric/Yarn/Material Demand Forecast */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Fabric/Yarn/Material Demand Forecast</Text>
        <View style={styles.materialForecast}>
          <View style={styles.materialItem}>
            <Text style={styles.materialName}>Cotton Fabric</Text>
            <View style={styles.materialDetails}>
              <Text style={styles.materialQuantity}>Required: 1,200 meters</Text>
              <Text style={styles.materialTimeline}>For next 30 days</Text>
            </View>
            <View style={styles.materialStatus}>
              <View style={[styles.statusIndicator, styles.statusAdequate]} />
              <Text style={styles.statusText}>Adequate</Text>
            </View>
          </View>
          <View style={styles.materialItem}>
            <Text style={styles.materialName}>Polyester Yarn</Text>
            <View style={styles.materialDetails}>
              <Text style={styles.materialQuantity}>Required: 800 kg</Text>
              <Text style={styles.materialTimeline}>For next 30 days</Text>
            </View>
            <View style={styles.materialStatus}>
              <View style={[styles.statusIndicator, styles.statusLow]} />
              <Text style={styles.statusText}>Low Stock</Text>
            </View>
          </View>
          <View style={styles.materialItem}>
            <Text style={styles.materialName}>Elastic Thread</Text>
            <View style={styles.materialDetails}>
              <Text style={styles.materialQuantity}>Required: 150 spools</Text>
              <Text style={styles.materialTimeline}>For next 30 days</Text>
            </View>
            <View style={styles.materialStatus}>
              <View style={[styles.statusIndicator, styles.statusCritical]} />
              <Text style={styles.statusText}>Critical</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Budget Impact Simulation */}
      <View style={styles.contentRow}>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Budget Impact Simulation</Text>
          <Text style={styles.metricLarge}>₹4.2L</Text>
          <Text style={styles.trendTextPositive}>↑ 12% vs last month</Text>
          <Text style={styles.cardDescription}>
            Projected procurement spend for next quarter
          </Text>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Cost Savings Potential</Text>
          <Text style={styles.metricLarge}>₹85K</Text>
          <Text style={styles.trendTextPositive}>↑ 8% vs last month</Text>
          <Text style={styles.cardDescription}>
            Through optimized ordering and vendor consolidation
          </Text>
        </View>
      </View>
      
      {/* AI Actions */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>AI-Powered Recommendations</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-up" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>Increase PO for SKU X by 15% to avoid OOS</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-down" size={16} color="#EF4444" />
            <Text style={styles.bulletText}>Reduce purchase of SKU Y — forecast drop of 28%</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>Switch to ABC Textiles for SKU Z to reduce lead time by 3 days</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="wallet" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>Consolidate orders with XYZ Fabrics to save 12% on shipping costs</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProcurementTab;

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
  cardDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
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
  // Vendor styles
  vendorTable: {
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
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  vendorName: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  leadTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  reliabilityContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  reliabilityBar: {
    height: 6,
    borderRadius: 3,
  },
  reliabilityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    width: 40,
  },
  // PO styles
  poRecommendations: {
    gap: 12,
  },
  poItem: {
    padding: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  poHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skuName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  poQuantity: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
  poDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  detailText: {
    fontSize: 12,
    color: '#64748B',
  },
  optimized: {
    color: '#10B981',
    fontWeight: '600',
  },
  // MOQ styles
  moqChart: {
    marginTop: 10,
  },
  chartRow: {
    marginBottom: 15,
  },
  skuLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  chartBarsContainer: {
    gap: 6,
  },
  chartBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chartBar: {
    height: 20,
    borderRadius: 10,
  },
  barLabel: {
    fontSize: 12,
    color: '#64748B',
    minWidth: 80,
  },
  // Demand forecast styles
  demandForecast: {
    gap: 12,
  },
  forecastItem: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  forecastDetails: {
    marginVertical: 8,
  },
  currentStock: {
    fontSize: 12,
    color: '#64748B',
  },
  predictedDemand: {
    fontSize: 12,
    color: '#64748B',
  },
  reorderPoint: {
    fontSize: 12,
    color: '#64748B',
  },
  actionContainer: {
    alignItems: 'flex-end',
  },
  actionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionOrder: {
    backgroundColor: '#DBEAFE',
  },
  actionHold: {
    backgroundColor: '#FEF3C7',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  // Material forecast styles
  materialForecast: {
    gap: 12,
  },
  materialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  materialName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  materialDetails: {
    flex: 1,
  },
  materialQuantity: {
    fontSize: 13,
    color: '#1E293B',
  },
  materialTimeline: {
    fontSize: 11,
    color: '#94A3B8',
  },
  materialStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusAdequate: {
    backgroundColor: '#10B981',
  },
  statusLow: {
    backgroundColor: '#F59E0B',
  },
  statusCritical: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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