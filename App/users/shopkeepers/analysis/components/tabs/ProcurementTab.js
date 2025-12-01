import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ProcurementTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Procurement Simulation</Text>
        <Text style={styles.description}>
          Vendor intelligence, PO optimization, and material demand forecasting
        </Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Procurement Signals</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="time" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>Vendor-wise lead times and reliability scores</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="calculator" size={16} color="#10B981" />
            <Text style={styles.bulletText}>Recommended PO quantities balancing MOQ vs demand</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="shirt" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>Fabric/yarn/material demand forecast</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="wallet" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>Budget impact simulation for PO adjustments</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ProcurementTab;

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