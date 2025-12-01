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
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Forecast Highlights</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-up" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>Top 10 fast movers by uplift vs last week</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-down" size={16} color="#EF4444" />
            <Text style={styles.bulletText}>Top 10 slow movers trending to markdown</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="map" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>Region-wise demand maps to align supply</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={styles.bulletText}>Confidence scores per item for planning</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Predictions</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="calendar" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>Weekend spike of 2.1x expected on beverages</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="location" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>SKU X selling 3x faster in Bangalore</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-up" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>SKU Y trending on marketplace channels</Text>
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
  card: {
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