import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { DASHBOARD_CONSTANTS } from '../constants';

const StockLevels = ({ stockLevels }) => {
  const levels = [
    {
      key: 'good',
      count: stockLevels.good,
      ...DASHBOARD_CONSTANTS.STOCK_LEVELS.GOOD,
    },
    {
      key: 'low',
      count: stockLevels.low,
      ...DASHBOARD_CONSTANTS.STOCK_LEVELS.LOW,
    },
    {
      key: 'critical',
      count: stockLevels.critical,
      ...DASHBOARD_CONSTANTS.STOCK_LEVELS.CRITICAL,
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stock Levels</Text>
      <View style={styles.grid}>
        {levels.map((level) => (
          <View key={level.key} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.indicator, { backgroundColor: level.color }]} />
              <Text style={styles.label}>{level.label}</Text>
            </View>
            <Text style={styles.count}>{level.count}</Text>
            <Text style={styles.unit}>Items</Text>
          </View>
        ))}
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
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
  },
  count: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  unit: {
    fontSize: 12,
    color: '#6B7280',
  },
});

export default StockLevels;
