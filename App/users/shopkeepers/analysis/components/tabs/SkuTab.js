import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SkuTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>SKU Performance Intelligence</Text>
        <Text style={styles.description}>
          Deep dive into SKU lifecycle, performance metrics, and variant-level analytics
        </Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lifecycle & Performance</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="git-branch" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>Stage classification: New/Growth/Peak/Decline</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="color-palette" size={16} color="#10B981" />
            <Text style={styles.bulletText}>Style-level and variant-level performance</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="bar-chart" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>Margin contribution and sell-through heatmaps</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="return-down-back" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>Return-rate analytics for quality investigations</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Actions</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="refresh" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>SKU X has 70% sell-through and should be reordered</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="warning" size={16} color="#EF4444" />
            <Text style={styles.bulletText}>SKU Y has 18% return rate - quality check needed</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default SkuTab;

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