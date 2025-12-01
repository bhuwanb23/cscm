import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DemandTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Demand Forecast Engine</Text>
        <Text style={styles.description}>
          AI-powered demand forecasting with region-wise predictions and confidence scoring
        </Text>
      </View>
      
      {/* Forecast Overview */}
      <View style={styles.contentRow}>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>7-Day Forecast Accuracy</Text>
          <Text style={styles.metricLarge}>92%</Text>
          <Text style={styles.trendTextPositive}>↑ 3% from last period</Text>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Forecast Confidence</Text>
          <Text style={styles.metricLarge}>87%</Text>
          <Text style={styles.trendTextPositive}>↑ 2% from last period</Text>
        </View>
      </View>
      
      {/* Predictive Sales Curve */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Predictive Sales Curve</Text>
        <View style={styles.chartContainer}>
          {/* Simulated sales curve visualization */}
          <View style={styles.curveContainer}>
            <View style={styles.curveLine} />
            <View style={styles.curvePoints}>
              <View style={[styles.curvePoint, { left: '10%' }]} />
              <View style={[styles.curvePoint, { left: '25%' }]} />
              <View style={[styles.curvePoint, { left: '40%' }]} />
              <View style={[styles.curvePoint, { left: '55%', backgroundColor: '#3B82F6' }]} />
              <View style={[styles.curvePoint, { left: '70%', backgroundColor: '#3B82F6' }]} />
              <View style={[styles.curvePoint, { left: '85%', backgroundColor: '#3B82F6' }]} />
            </View>
          </View>
          <View style={styles.curveLabels}>
            <Text style={styles.curveLabel}>Current</Text>
            <Text style={styles.curveLabel}>Forecast</Text>
          </View>
        </View>
      </View>
      
      {/* Multi-Period Forecast */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Demand Forecast Horizon</Text>
        <View style={styles.forecastGrid}>
          <View style={styles.forecastItem}>
            <Text style={styles.forecastPeriod}>7 Days</Text>
            <Text style={styles.forecastValue}>↑ 12%</Text>
          </View>
          <View style={styles.forecastItem}>
            <Text style={styles.forecastPeriod}>14 Days</Text>
            <Text style={styles.forecastValue}>↑ 8%</Text>
          </View>
          <View style={styles.forecastItem}>
            <Text style={styles.forecastPeriod}>30 Days</Text>
            <Text style={styles.forecastValue}>↑ 15%</Text>
          </View>
          <View style={styles.forecastItem}>
            <Text style={styles.forecastPeriod}>60 Days</Text>
            <Text style={styles.forecastValue}>↑ 22%</Text>
          </View>
          <View style={styles.forecastItem}>
            <Text style={styles.forecastPeriod}>90 Days</Text>
            <Text style={styles.forecastValue}>↑ 18%</Text>
          </View>
        </View>
      </View>
      
      {/* Top Movers */}
      <View style={styles.contentRow}>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Top 10 Fast Movers</Text>
          <View style={styles.moversList}>
            <View style={styles.moverItem}>
              <Text style={styles.moverName}>SKU A123 - Summer Dress</Text>
              <Text style={styles.moverChangePositive}>↑ 45%</Text>
            </View>
            <View style={styles.moverItem}>
              <Text style={styles.moverName}>SKU B456 - Casual Tee</Text>
              <Text style={styles.moverChangePositive}>↑ 38%</Text>
            </View>
            <View style={styles.moverItem}>
              <Text style={styles.moverName}>SKU C789 - Denim Jacket</Text>
              <Text style={styles.moverChangePositive}>↑ 32%</Text>
            </View>
          </View>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Top 10 Slow Movers</Text>
          <View style={styles.moversList}>
            <View style={styles.moverItem}>
              <Text style={styles.moverName}>SKU X987 - Winter Coat</Text>
              <Text style={styles.moverChangeNegative}>↓ 28%</Text>
            </View>
            <View style={styles.moverItem}>
              <Text style={styles.moverName}>SKU Y654 - Formal Shirt</Text>
              <Text style={styles.moverChangeNegative}>↓ 22%</Text>
            </View>
            <View style={styles.moverItem}>
              <Text style={styles.moverName}>SKU Z321 - Party Wear</Text>
              <Text style={styles.moverChangeNegative}>↓ 18%</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Category Predictions */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Category Demand Predictions</Text>
        <View style={styles.chartContainer}>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Tops</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '75%', backgroundColor: '#10B981' }]} />
              <Text style={styles.chartValue}>↑ 18%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Bottoms</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '60%', backgroundColor: '#3B82F6' }]} />
              <Text style={styles.chartValue}>↑ 12%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Dresses</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '45%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.chartValue}>↑ 8%</Text>
            </View>
          </View>
          <View style={styles.chartRow}>
            <Text style={styles.chartLabel}>Accessories</Text>
            <View style={styles.chartBarContainer}>
              <View style={[styles.chartBar, { width: '30%', backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.chartValue}>↓ 5%</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Region-wise Forecast */}
      <View style={styles.fullCard}>
        <Text style={styles.cardTitle}>Region-wise Demand Forecast</Text>
        <View style={styles.regionMap}>
          <View style={styles.regionRow}>
            <Text style={styles.regionName}>North</Text>
            <View style={styles.regionBarContainer}>
              <View style={[styles.regionBar, { width: '80%', backgroundColor: '#10B981' }]} />
              <Text style={styles.regionValue}>↑ 22%</Text>
            </View>
          </View>
          <View style={styles.regionRow}>
            <Text style={styles.regionName}>South</Text>
            <View style={styles.regionBarContainer}>
              <View style={[styles.regionBar, { width: '65%', backgroundColor: '#3B82F6' }]} />
              <Text style={styles.regionValue}>↑ 15%</Text>
            </View>
          </View>
          <View style={styles.regionRow}>
            <Text style={styles.regionName}>East</Text>
            <View style={styles.regionBarContainer}>
              <View style={[styles.regionBar, { width: '45%', backgroundColor: '#F59E0B' }]} />
              <Text style={styles.regionValue}>↑ 8%</Text>
            </View>
          </View>
          <View style={styles.regionRow}>
            <Text style={styles.regionName}>West</Text>
            <View style={styles.regionBarContainer}>
              <View style={[styles.regionBar, { width: '70%', backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.regionValue}>↑ 18%</Text>
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
            <Text style={styles.bulletText}>SKU A123 (Summer Dress) will face OOS in 7 days - reorder recommended</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="calendar" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>SKU B456 (Casual Tee) predicted to spike by 120% during weekend - increase stock</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-up" size={16} color="#10B981" />
            <Text style={styles.bulletText}>SKU C789 (Denim Jacket) trending on marketplace channels - boost marketing</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="location" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>Regional demand surge in South zone - redistribute inventory from North</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DemandTab;

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
  // Sales curve styles
  curveContainer: {
    height: 120,
    position: 'relative',
    marginTop: 20,
  },
  curveLine: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  curvePoints: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  curvePoint: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94A3B8',
    top: 54,
    marginLeft: -6,
  },
  curveLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  curveLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  // Forecast grid styles
  forecastGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  forecastItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  forecastPeriod: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  forecastValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },
  // Movers list styles
  moversList: {
    gap: 10,
  },
  moverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  moverName: {
    fontSize: 13,
    color: '#4B5563',
    flex: 1,
  },
  moverChangePositive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  moverChangeNegative: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EF4444',
  },
  // Region map styles
  regionMap: {
    marginTop: 10,
  },
  regionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  regionName: {
    width: 60,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  regionBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  regionBar: {
    height: 20,
    borderRadius: 10,
    marginRight: 10,
  },
  regionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
    minWidth: 40,
  },
});