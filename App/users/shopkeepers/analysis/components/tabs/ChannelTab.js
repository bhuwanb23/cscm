import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChannelTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Channel Sync & Availability Mesh</Text>
        <Text style={styles.description}>
          Real-time synchronization across all sales channels with intelligent stock allocation
        </Text>
      </View>
      
      {/* D2C vs Marketplace Inventory Comparison */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>D2C vs Marketplace Inventory Comparison</Text>
        <View style={styles.comparisonGrid}>
          <View style={styles.comparisonHeader}>
            <Text style={styles.headerCell}>Channel</Text>
            <Text style={styles.headerCell}>Stock Level</Text>
            <Text style={styles.headerCell}>Sync Status</Text>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.channelName}>D2C Store</Text>
            <Text style={styles.stockValue}>1,245 units</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, styles.statusGreen]} />
              <Text style={styles.statusText}>Synced</Text>
            </View>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.channelName}>Amazon</Text>
            <Text style={styles.stockValue}>892 units</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, styles.statusYellow]} />
              <Text style={styles.statusText}>Partial</Text>
            </View>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.channelName}>Flipkart</Text>
            <Text style={styles.stockValue}>1,056 units</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, styles.statusGreen]} />
              <Text style={styles.statusText}>Synced</Text>
            </View>
          </View>
          <View style={styles.comparisonRow}>
            <Text style={styles.channelName}>Meesho</Text>
            <Text style={styles.stockValue}>734 units</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusIndicator, styles.statusRed]} />
              <Text style={styles.statusText}>Out of Sync</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Channel-wise Stock Segregation */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Channel-wise Stock Segregation</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartRow}>
            <Text style={styles.channelLabel}>D2C Store</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '35%', backgroundColor: '#3B82F6' }]} />
              <Text style={styles.chartValue}>35%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.channelLabel}>Amazon</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '25%', backgroundColor: '#10B981' }]} />
              <Text style={styles.chartValue}>25%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.channelLabel}>Flipkart</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '20%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.chartValue}>20%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.channelLabel}>Meesho</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '15%', backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.chartValue}>15%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.channelLabel}>Others</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '5%', backgroundColor: '#EF4444' }]} />
              <Text style={styles.chartValue}>5%</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* API Sync Health */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>API Sync Health</Text>
        <View style={styles.healthGrid}>
          <View style={styles.healthItem}>
            <Text style={styles.healthChannel}>Amazon API</Text>
            <View style={styles.healthStatus}>
              <View style={[styles.healthIndicator, styles.healthGood]} />
              <Text style={styles.healthText}>99.2% Uptime</Text>
            </View>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthChannel}>Flipkart API</Text>
            <View style={styles.healthStatus}>
              <View style={[styles.healthIndicator, styles.healthGood]} />
              <Text style={styles.healthText}>98.7% Uptime</Text>
            </View>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthChannel}>Meesho API</Text>
            <View style={styles.healthStatus}>
              <View style={[styles.healthIndicator, styles.healthWarning]} />
              <Text style={styles.healthText}>92.4% Uptime</Text>
            </View>
          </View>
          <View style={styles.healthItem}>
            <Text style={styles.healthChannel}>Shopify API</Text>
            <View style={styles.healthStatus}>
              <View style={[styles.healthIndicator, styles.healthCritical]} />
              <Text style={styles.healthText}>78.3% Uptime</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Fake Stock Detection */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Fake Stock Detection</Text>
        <View style={styles.fakeStockList}>
          <View style={styles.fakeStockItem}>
            <View style={styles.fakeStockHeader}>
              <Text style={styles.skuName}>SKU A123 - Summer Dress</Text>
              <View style={styles.riskContainer}>
                <View style={[styles.riskIndicator, styles.riskHigh]} />
                <Text style={styles.riskText}>High Risk</Text>
              </View>
            </View>
            <Text style={styles.fakeStockDetail}>Reported: 50 units | Actual: 23 units</Text>
            <Text style={styles.fakeStockReason}>Mismatch detected across 3 channels</Text>
          </View>
          <View style={styles.fakeStockItem}>
            <View style={styles.fakeStockHeader}>
              <Text style={styles.skuName}>SKU B456 - Casual Tee</Text>
              <View style={styles.riskContainer}>
                <View style={[styles.riskIndicator, styles.riskMedium]} />
                <Text style={styles.riskText}>Medium Risk</Text>
              </View>
            </View>
            <Text style={styles.fakeStockDetail}>Reported: 120 units | Actual: 87 units</Text>
            <Text style={styles.fakeStockReason}>Inconsistent updates from marketplace</Text>
          </View>
        </View>
      </View>
      
      {/* Marketplace Overselling Risk Indicators */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Marketplace Overselling Risk Indicators</Text>
        <View style={styles.riskGrid}>
          <View style={styles.riskItem}>
            <Text style={styles.riskChannel}>Amazon</Text>
            <View style={styles.riskLevel}>
              <View style={[styles.riskBar, styles.riskLow]} />
              <Text style={styles.riskValue}>Low</Text>
            </View>
          </View>
          <View style={styles.riskItem}>
            <Text style={styles.riskChannel}>Flipkart</Text>
            <View style={styles.riskLevel}>
              <View style={[styles.riskBar, styles.riskLow]} />
              <Text style={styles.riskValue}>Low</Text>
            </View>
          </View>
          <View style={styles.riskItem}>
            <Text style={styles.riskChannel}>Meesho</Text>
            <View style={styles.riskLevel}>
              <View style={[styles.riskBar, styles.riskMedium]} />
              <Text style={styles.riskValue}>Medium</Text>
            </View>
          </View>
          <View style={styles.riskItem}>
            <Text style={styles.riskChannel}>Shopify</Text>
            <View style={styles.riskLevel}>
              <View style={[styles.riskBar, styles.riskHigh]} />
              <Text style={styles.riskValue}>High</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Quick Commerce Readiness Score */}
      <View style={styles.contentRow}>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Quick Commerce Readiness</Text>
          <Text style={styles.metricLarge}>84/100</Text>
          <Text style={styles.trendTextPositive}>↑ 6 pts vs last week</Text>
          <Text style={styles.cardDescription}>
            Based on stock availability, packaging time, and delivery readiness
          </Text>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Sync Accuracy</Text>
          <Text style={styles.metricLarge}>92%</Text>
          <Text style={styles.trendTextPositive}>↑ 3% vs last week</Text>
          <Text style={styles.cardDescription}>
            Percentage of SKUs correctly synced across channels
          </Text>
        </View>
      </View>
      
      {/* AI Actions */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>AI-Powered Recommendations</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.bulletText}>16 SKUs not synced across Shopify, Meesho, Amazon</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="sync" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>Listing mismatch for SKU X across channels</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="warning" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>High overselling risk on Shopify - reduce stock by 20%</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="time" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>Enable auto-sync for 5 high-velocity SKUs to improve accuracy</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ChannelTab;

const styles = StyleSheet.create({
  container: {
    padding: 16,
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
  // Comparison styles
  comparisonGrid: {
    marginTop: 10,
  },
  comparisonHeader: {
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
  comparisonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  channelName: {
    fontSize: 14,
    color: '#1E293B',
    flex: 1,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    textAlign: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    justifyContent: 'flex-end',
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
  // Chart styles
  chartContainer: {
    marginTop: 10,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  channelLabel: {
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
  // Health styles
  healthGrid: {
    gap: 12,
  },
  healthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  healthChannel: {
    fontSize: 14,
    color: '#1E293B',
  },
  healthStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  healthIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  healthGood: {
    backgroundColor: '#10B981',
  },
  healthWarning: {
    backgroundColor: '#F59E0B',
  },
  healthCritical: {
    backgroundColor: '#EF4444',
  },
  healthText: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Fake stock styles
  fakeStockList: {
    gap: 12,
  },
  fakeStockItem: {
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  fakeStockHeader: {
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
  riskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  riskHigh: {
    backgroundColor: '#EF4444',
  },
  riskMedium: {
    backgroundColor: '#F59E0B',
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
  fakeStockDetail: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  fakeStockReason: {
    fontSize: 12,
    color: '#94A3B8',
  },
  // Risk styles
  riskGrid: {
    gap: 12,
  },
  riskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  riskChannel: {
    fontSize: 14,
    color: '#1E293B',
  },
  riskLevel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riskBar: {
    width: 60,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  riskLow: {
    backgroundColor: '#10B981',
    width: 20,
  },
  riskMedium: {
    backgroundColor: '#F59E0B',
    width: 40,
  },
  riskHigh: {
    backgroundColor: '#EF4444',
    width: 60,
  },
  riskValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    width: 50,
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