import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { METRIC_CONFIG } from '../constants';

const MetricCard = ({ metricKey, value }) => {
  const config = METRIC_CONFIG[metricKey];
  
  if (!config) return null;

  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{config.label}</Text>
      <Text style={[styles.metricValue, config.color && { color: config.color }]}>
        {config.prefix || ''}
        {typeof value === 'number' && value % 1 !== 0 ? value.toFixed(1) : value}
        {config.suffix || ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
});

export default MetricCard;