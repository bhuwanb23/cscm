import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InventoryTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Inventory Health Dashboard</Text>
        <Text style={styles.description}>
          Live view of all SKUs by node, with low-stock and excess-stock heat overlays
        </Text>
      </View>
      
      <View style={styles.cardRow}>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>Inventory Mesh</Text>
          <Text style={styles.cardText}>
            Live view of all SKUs by node, with low‑stock and excess‑stock heat overlays.
          </Text>
        </View>
        <View style={styles.halfCard}>
          <Text style={styles.cardTitle}>SKU Velocity</Text>
          <Text style={styles.cardText}>
            Fast vs slow movers by store, with demand spikes and ageing buckets.
          </Text>
        </View>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Actions</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.bulletText}>Predicts which SKUs will go OOS in 7-14 days</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.bulletText}>Flags slow-moving SKUs for sale</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.bulletText}>Highlights store-to-store transfers</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.bulletText}>Surfaces ageing items beyond 90 days</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default InventoryTab;

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
  cardRow: {
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
    marginBottom: 8,
  },
  cardText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
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