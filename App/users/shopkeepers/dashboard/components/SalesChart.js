import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DASHBOARD_CONSTANTS } from '../constants';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 32;
const CHART_HEIGHT = 140;
const BAR_WIDTH = (CHART_WIDTH - 40) / 7; // 7 days, with padding

const SalesChart = () => {
  const maxValue = Math.max(...DASHBOARD_CONSTANTS.CHART_DATA.data);
  
  const renderBar = (value, index) => {
    const height = (value / maxValue) * (CHART_HEIGHT - 40);
    return (
      <View key={index} style={styles.barContainer}>
        <View style={styles.barWrapper}>
          <LinearGradient
            colors={['#3B82F6', '#1E40AF']}
            style={[
              styles.bar,
              {
                height: height,
              },
            ]}
          />
        </View>
        <Text style={styles.dayLabel}>
          {DASHBOARD_CONSTANTS.CHART_DATA.categories[index]}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sales Analytics</Text>
      <View style={styles.chartContainer}>
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.chartGradient}
        >
          <View style={styles.chart}>
            {DASHBOARD_CONSTANTS.CHART_DATA.data.map((value, index) => renderBar(value, index))}
          </View>
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Top Selling Items</Text>
            {DASHBOARD_CONSTANTS.TOP_SELLING_ITEMS.map((item, index) => (
              <View 
                key={index} 
                style={styles.legendItem}
              >
                <View style={styles.legendLeft}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}</Text>
                </View>
                <View style={styles.legendRight}>
                  <Text style={styles.legendValue}>{item.sold}</Text>
                  <Text style={styles.legendUnit}>sold</Text>
                </View>
              </View>
            ))}
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  chartGradient: {
    padding: 16,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barWrapper: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  bar: {
    width: BAR_WIDTH - 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  legend: {
    gap: 8,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  legendUnit: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});

export default SalesChart;