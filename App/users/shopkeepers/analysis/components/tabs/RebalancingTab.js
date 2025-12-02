import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RebalancingTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Rebalancing & Optimal Allocation</Text>
        <Text style={styles.description}>
          Intelligent inventory redistribution across nodes to optimize stock levels
        </Text>
      </View>
      
      {/* Suggested Store-to-Store Transfers */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Suggested Store-to-Store Transfers</Text>
        <View style={styles.transferList}>
          <View style={styles.transferItem}>
            <View style={styles.transferHeader}>
              <Text style={styles.transferSku}>SKU A123</Text>
              <Text style={styles.transferQuantity}>12 units</Text>
            </View>
            <View style={styles.transferRoute}>
              <Text style={styles.transferFrom}>Store 4</Text>
              <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
              <Text style={styles.transferTo}>Store 2</Text>
            </View>
            <Text style={styles.transferReason}>Low stock at destination, excess at source</Text>
          </View>
          <View style={styles.transferItem}>
            <View style={styles.transferHeader}>
              <Text style={styles.transferSku}>SKU B456</Text>
              <Text style={styles.transferQuantity}>8 units</Text>
            </View>
            <View style={styles.transferRoute}>
              <Text style={styles.transferFrom}>Store 1</Text>
              <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
              <Text style={styles.transferTo}>Store 3</Text>
            </View>
            <Text style={styles.transferReason}>Seasonal demand spike predicted</Text>
          </View>
          <View style={styles.transferItem}>
            <View style={styles.transferHeader}>
              <Text style={styles.transferSku}>SKU C789</Text>
              <Text style={styles.transferQuantity}>15 units</Text>
            </View>
            <View style={styles.transferRoute}>
              <Text style={styles.transferFrom}>Store 5</Text>
              <Ionicons name="arrow-forward" size={16} color="#3B82F6" />
              <Text style={styles.transferTo}>Store 1</Text>
            </View>
            <Text style={styles.transferReason}>Clearing excess stock before season ends</Text>
          </View>
        </View>
      </View>
      
      {/* Suggested Warehouse-to-Store Replenishments */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Suggested Warehouse-to-Store Replenishments</Text>
        <View style={styles.replenishmentList}>
          <View style={styles.replenishmentItem}>
            <View style={styles.replenishmentHeader}>
              <Text style={styles.replenishmentSku}>SKU C123</Text>
              <Text style={styles.replenishmentQuantity}>200 units</Text>
            </View>
            <View style={styles.replenishmentRoute}>
              <Text style={styles.replenishmentFrom}>Warehouse B</Text>
              <Ionicons name="arrow-forward" size={16} color="#10B981" />
              <Text style={styles.replenishmentTo}>Store 3</Text>
            </View>
            <Text style={styles.replenishmentReason}>Stockout risk in 5 days</Text>
          </View>
          <View style={styles.replenishmentItem}>
            <View style={styles.replenishmentHeader}>
              <Text style={styles.replenishmentSku}>SKU D456</Text>
              <Text style={styles.replenishmentQuantity}>150 units</Text>
            </View>
            <View style={styles.replenishmentRoute}>
              <Text style={styles.replenishmentFrom}>Warehouse A</Text>
              <Ionicons name="arrow-forward" size={16} color="#10B981" />
              <Text style={styles.replenishmentTo}>Store 1</Text>
            </View>
            <Text style={styles.replenishmentReason}>Fast mover with low current stock</Text>
          </View>
        </View>
      </View>
      
      {/* AI Allocation Map */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>AI Allocation Map</Text>
        <View style={styles.allocationMap}>
          <View style={styles.mapRow}>
            <Text style={styles.mapNode}>Warehouse A</Text>
            <View style={styles.mapConnections}>
              <View style={[styles.mapConnection, { width: '40%', backgroundColor: '#10B981' }]} />
              <View style={[styles.mapConnection, { width: '30%', backgroundColor: '#3B82F6' }]} />
              <View style={[styles.mapConnection, { width: '20%', backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
          <View style={styles.mapRow}>
            <Text style={styles.mapNode}>Warehouse B</Text>
            <View style={styles.mapConnections}>
              <View style={[styles.mapConnection, { width: '25%', backgroundColor: '#10B981' }]} />
              <View style={[styles.mapConnection, { width: '35%', backgroundColor: '#3B82F6' }]} />
              <View style={[styles.mapConnection, { width: '30%', backgroundColor: '#F59E0B' }]} />
            </View>
          </View>
          <View style={styles.mapLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Store 1</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.legendText}>Store 2</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Store 3</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Cost-Saving Estimate */}
      <View style={styles.contentRow}>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Cost-Saving Estimate</Text>
          <Text style={styles.metricLarge}>₹1.2L</Text>
          <Text style={styles.trendTextPositive}>↑ 18% vs last month</Text>
          <Text style={styles.cardDescription}>
            Potential savings from optimized transfers and reduced stockouts
          </Text>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Transfer Efficiency</Text>
          <Text style={styles.metricLarge}>87%</Text>
          <Text style={styles.trendTextPositive}>↑ 5% vs last month</Text>
          <Text style={styles.cardDescription}>
            Percentage of optimal allocation achieved
          </Text>
        </View>
      </View>
      
      {/* Real-time Transfer Feasibility */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Real-time Transfer Feasibility</Text>
        <View style={styles.feasibilityGrid}>
          <View style={styles.feasibilityItem}>
            <Text style={styles.feasibilityRoute}>Store 1 → Store 2</Text>
            <View style={styles.feasibilityStatus}>
              <View style={[styles.statusIndicator, styles.statusGreen]} />
              <Text style={styles.statusText}>Feasible</Text>
            </View>
          </View>
          <View style={styles.feasibilityItem}>
            <Text style={styles.feasibilityRoute}>Store 3 → Store 1</Text>
            <View style={styles.feasibilityStatus}>
              <View style={[styles.statusIndicator, styles.statusYellow]} />
              <Text style={styles.statusText}>Partially Feasible</Text>
            </View>
          </View>
          <View style={styles.feasibilityItem}>
            <Text style={styles.feasibilityRoute}>Store 4 → Store 5</Text>
            <View style={styles.feasibilityStatus}>
              <View style={[styles.statusIndicator, styles.statusRed]} />
              <Text style={styles.statusText}>Not Feasible</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Truck Capacity Optimization */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Truck Capacity Optimization</Text>
        <View style={styles.truckOptimization}>
          <View style={styles.truckRow}>
            <Text style={styles.truckId}>Truck #101</Text>
            <View style={styles.capacityContainer}>
              <View style={styles.capacityBar}>
                <View style={[styles.capacityFill, { width: '75%', backgroundColor: '#3B82F6' }]} />
              </View>
              <Text style={styles.capacityText}>75% Used</Text>
            </View>
          </View>
          <View style={styles.truckRow}>
            <Text style={styles.truckId}>Truck #102</Text>
            <View style={styles.capacityContainer}>
              <View style={styles.capacityBar}>
                <View style={[styles.capacityFill, { width: '45%', backgroundColor: '#10B981' }]} />
              </View>
              <Text style={styles.capacityText}>45% Used</Text>
            </View>
          </View>
          <View style={styles.truckRow}>
            <Text style={styles.truckId}>Truck #103</Text>
            <View style={styles.capacityContainer}>
              <View style={styles.capacityBar}>
                <View style={[styles.capacityFill, { width: '90%', backgroundColor: '#F59E0B' }]} />
              </View>
              <Text style={styles.capacityText}>90% Used</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* AI Actions */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>AI-Powered Recommendations</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>Transfer 12 units of SKU A from Store 4 → Store 2</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="home" size={16} color="#10B981" />
            <Text style={styles.bulletText}>Replenish Warehouse B with 200 units of SKU C</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="cash" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>Consolidate shipments to Truck #101 to save 15% on fuel costs</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="time" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>Schedule Store 3 replenishment during off-peak hours to reduce delivery time</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default RebalancingTab;

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
  // Transfer styles
  transferList: {
    gap: 12,
  },
  transferItem: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  transferHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transferSku: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  transferQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  transferRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  transferFrom: {
    fontSize: 13,
    color: '#64748B',
  },
  transferTo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  transferReason: {
    fontSize: 12,
    color: '#94A3B8',
  },
  // Replenishment styles
  replenishmentList: {
    gap: 12,
  },
  replenishmentItem: {
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  replenishmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  replenishmentSku: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  replenishmentQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  replenishmentRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  replenishmentFrom: {
    fontSize: 13,
    color: '#64748B',
  },
  replenishmentTo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  replenishmentReason: {
    fontSize: 12,
    color: '#94A3B8',
  },
  // Allocation map styles
  allocationMap: {
    marginTop: 10,
  },
  mapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  mapNode: {
    width: 100,
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  mapConnections: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  mapConnection: {
    height: 8,
    borderRadius: 4,
  },
  mapLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
  },
  // Feasibility styles
  feasibilityGrid: {
    gap: 12,
  },
  feasibilityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  feasibilityRoute: {
    fontSize: 14,
    color: '#1E293B',
  },
  feasibilityStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusGreen: {
    backgroundColor: '#10B981',
  },
  statusYellow: {
    backgroundColor: '#F59E0B',
  },
  statusRed: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Truck optimization styles
  truckOptimization: {
    marginTop: 10,
  },
  truckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  truckId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    width: 80,
  },
  capacityContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  capacityBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 4,
  },
  capacityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    width: 70,
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