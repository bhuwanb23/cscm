import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { METRIC_CONFIG } from '../constants';

const MetricCard = () => {
  return null; // MetricCard is now integrated into the main Analysis component
};

export default MetricCard;

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
