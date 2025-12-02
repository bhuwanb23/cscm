import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/shopkeeperConstants';
import CSCMCard from './CSCMCard';

const PerformanceOverview = ({ performanceMetrics }) => {
  return (
    <CSCMCard title="Performance Overview">
      <View style={styles.metricsContainer}>
        {performanceMetrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <Text style={styles.metricName}>{metric.name}</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.metricValue}>{metric.value}</Text>
              <Text style={styles.metricUnit}>{metric.unit}</Text>
            </View>
            <View style={styles.trendContainer}>
              <Ionicons 
                name={metric.trend === 'up' ? "trending-up" : "trending-down"} 
                size={16} 
                color={metric.trend === 'up' ? COLORS.success : COLORS.danger} 
              />
              <Text style={[
                styles.trendText, 
                { color: metric.trend === 'up' ? COLORS.success : COLORS.danger }
              ]}>
                {metric.trend === 'up' ? 'Improving' : 'Declining'}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </CSCMCard>
  );
};

const styles = StyleSheet.create({
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.slateLight,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricName: {
    ...TYPOGRAPHY.small,
    color: COLORS.slateDark,
    marginBottom: 8,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  metricValue: {
    ...TYPOGRAPHY.h1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.charcoal,
  },
  metricUnit: {
    ...TYPOGRAPHY.caption,
    color: COLORS.slateDark,
    marginLeft: 4,
    marginBottom: 2,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    ...TYPOGRAPHY.small,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default PerformanceOverview;