import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/shopkeeperConstants';
import CSCMCard from './CSCMCard';

const ComplianceRisk = ({ complianceRisk }) => {
  return (
    <CSCMCard title="Compliance & Risk">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stock Variance History</Text>
        <View style={styles.varianceContainer}>
          {complianceRisk.stockVariance.map((data, index) => (
            <View key={index} style={styles.varianceBarContainer}>
              <View style={styles.varianceBar}>
                <View 
                  style={[
                    styles.varianceFill, 
                    { height: `${data.variance * 10}%` }
                  ]} 
                />
              </View>
              <Text style={styles.monthLabel}>{data.month}</Text>
            </View>
          ))}
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expiring Items</Text>
        {complianceRisk.expiryItems.map((item) => (
          <View key={item.id} style={styles.expiryItem}>
            <View style={styles.expiryInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.expiryDate}>Expires: {item.expiryDate}</Text>
            </View>
            <View style={styles.quantityContainer}>
              <Text style={styles.quantity}>{item.quantity}</Text>
              <Text style={styles.quantityLabel}>units</Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Shrinkage Detection</Text>
        <View style={styles.shrinkageSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{complianceRisk.shrinkageInsights.detected}</Text>
            <Text style={styles.summaryLabel}>Anomalies Detected</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{complianceRisk.shrinkageInsights.lastScan}</Text>
            <Text style={styles.summaryLabel}>Last Scan</Text>
          </View>
        </View>
        
        <View style={styles.anomaliesList}>
          {complianceRisk.shrinkageInsights.anomalies.map((anomaly) => (
            <View key={anomaly.id} style={styles.anomalyItem}>
              <View style={styles.anomalyIcon}>
                <Ionicons 
                  name={
                    anomaly.type === 'possible-theft' ? 'shield-alert' : 
                    'alert-circle'
                  } 
                  size={16} 
                  color={
                    anomaly.severity === 'high' ? COLORS.danger : 
                    anomaly.severity === 'medium' ? COLORS.warning : 
                    COLORS.indigo
                  } 
                />
              </View>
              <View style={styles.anomalyInfo}>
                <Text style={styles.anomalyType}>
                  {anomaly.type === 'possible-theft' ? 'Possible Theft' : 'Inventory Error'}
                </Text>
                <Text style={styles.anomalySku}>SKU: {anomaly.sku}</Text>
              </View>
              <View style={[
                styles.severityBadge, 
                { 
                  backgroundColor: 
                    anomaly.severity === 'high' ? COLORS.dangerLight : 
                    anomaly.severity === 'medium' ? COLORS.warningLight : 
                    COLORS.slateLight 
                }
              ]}>
                <Text style={[
                  styles.severityText, 
                  { 
                    color: 
                      anomaly.severity === 'high' ? COLORS.danger : 
                      anomaly.severity === 'medium' ? COLORS.warning : 
                      COLORS.slateDark 
                  }
                ]}>
                  {anomaly.severity}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </CSCMCard>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    marginBottom: 12,
  },
  varianceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 80,
    paddingTop: 20,
  },
  varianceBarContainer: {
    alignItems: 'center',
  },
  varianceBar: {
    width: 30,
    height: 60,
    backgroundColor: COLORS.slateLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  varianceFill: {
    backgroundColor: COLORS.indigo,
    width: '100%',
  },
  monthLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.slateDark,
  },
  expiryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  expiryInfo: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.body,
  },
  expiryDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
    marginTop: 2,
  },
  quantityContainer: {
    alignItems: 'center',
  },
  quantity: {
    ...TYPOGRAPHY.h2,
    fontSize: 18,
  },
  quantityLabel: {
    ...TYPOGRAPHY.small,
    color: COLORS.slateDark,
  },
  shrinkageSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.slateLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    ...TYPOGRAPHY.h1,
    fontSize: 20,
  },
  summaryLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
    marginTop: 4,
  },
  anomaliesList: {
    // No additional styling needed
  },
  anomalyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  anomalyIcon: {
    marginRight: 12,
  },
  anomalyInfo: {
    flex: 1,
  },
  anomalyType: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  anomalySku: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
    marginTop: 2,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
});

export default ComplianceRisk;