import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/shopkeeperConstants';
import CSCMCard from './CSCMCard';

const SalesDemandInsights = ({ salesInsights }) => {
  return (
    <CSCMCard title="Sales & Demand Insights">
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling SKUs</Text>
        {salesInsights.topSellingSKUs.map((sku) => (
          <View key={sku.id} style={styles.skuItem}>
            <Text style={styles.skuName}>{sku.name}</Text>
            <View style={styles.skuMetrics}>
              <Text style={styles.salesCount}>{sku.sales} sold</Text>
              <Ionicons 
                name={sku.trend === 'up' ? "trending-up" : "trending-down"} 
                size={16} 
                color={sku.trend === 'up' ? COLORS.success : COLORS.danger} 
              />
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Slow Moving SKUs</Text>
        {salesInsights.slowMovingSKUs.map((sku) => (
          <View key={sku.id} style={styles.skuItem}>
            <Text style={styles.skuName}>{sku.name}</Text>
            <View style={styles.skuMetrics}>
              <Text style={styles.inventoryCount}>{sku.inventory} in stock</Text>
              <Ionicons 
                name="trending-down" 
                size={16} 
                color={COLORS.danger} 
              />
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Demand Prediction</Text>
        <View style={styles.predictionContainer}>
          <View style={styles.predictionHeader}>
            <Ionicons name="bulb" size={20} color={COLORS.indigo} />
            <Text style={styles.predictionTitle}>AI Forecast</Text>
            <View style={styles.confidenceBadge}>
              <Text style={styles.confidenceText}>{salesInsights.aiPrediction.confidence}% confidence</Text>
            </View>
          </View>
          <Text style={styles.predictionText}>{salesInsights.aiPrediction.nextMonthProjection}</Text>
          <View style={styles.trendIndicator}>
            <Ionicons 
              name="trending-up" 
              size={16} 
              color={COLORS.success} 
            />
            <Text style={styles.trendText}>Positive trend</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Replenishment Recommendations</Text>
        {salesInsights.replenishmentRecommendations.map((item) => (
          <View key={item.id} style={styles.recommendationItem}>
            <View style={styles.recommendationInfo}>
              <Text style={styles.skuName}>{item.sku}</Text>
              <Text style={styles.recommendedQuantity}>Recommended: {item.recommended} units</Text>
            </View>
            <View style={[
              styles.urgencyBadge, 
              { 
                backgroundColor: 
                  item.urgency === 'high' ? COLORS.dangerLight : 
                  item.urgency === 'medium' ? COLORS.warningLight : 
                  COLORS.slateLight 
              }
            ]}>
              <Text style={[
                styles.urgencyText, 
                { 
                  color: 
                    item.urgency === 'high' ? COLORS.danger : 
                    item.urgency === 'medium' ? COLORS.warning : 
                    COLORS.slateDark 
                }
              ]}>
                {item.urgency}
              </Text>
            </View>
          </View>
        ))}
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
  skuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  skuName: {
    ...TYPOGRAPHY.body,
    flex: 1,
  },
  skuMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  salesCount: {
    ...TYPOGRAPHY.caption,
    marginRight: 8,
  },
  inventoryCount: {
    ...TYPOGRAPHY.caption,
    marginRight: 8,
  },
  predictionContainer: {
    backgroundColor: COLORS.indigoLight,
    borderRadius: 12,
    padding: 16,
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    color: COLORS.indigo,
  },
  predictionText: {
    ...TYPOGRAPHY.body,
    marginBottom: 8,
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  recommendationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendedQuantity: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgencyText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
  },
});

export default SalesDemandInsights;