import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { DASHBOARD_CONSTANTS } from '../constants';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 32;
const CHART_HEIGHT = 120;
const BAR_WIDTH = (CHART_WIDTH - 40) / 7; // 7 days, with padding

const SalesChart = () => {
  const maxValue = Math.max(...DASHBOARD_CONSTANTS.CHART_DATA.data);
  
  const renderBar = (value, index) => {
    const height = (value / maxValue) * (CHART_HEIGHT - 40);
    return (
      <View key={index} style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            {
              height: height,
              backgroundColor: DASHBOARD_CONSTANTS.CHART_COLORS.PRIMARY,
            },
          ]}
        />
        <Text style={styles.dayLabel}>
          {DASHBOARD_CONSTANTS.CHART_DATA.categories[index]}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Selling Items</Text>
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {DASHBOARD_CONSTANTS.CHART_DATA.data.map((value, index) => renderBar(value, index))}
        </View>
        <View style={styles.legend}>
          {DASHBOARD_CONSTANTS.TOP_SELLING_ITEMS.map((item, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={styles.legendText}>{item.name}</Text>
              <Text style={styles.legendValue}>{item.sold} sold</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
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
  bar: {
    width: BAR_WIDTH,
    borderRadius: 2,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
});

export default SalesChart;
