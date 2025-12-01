import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const InventoryTab = () => {
  return (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Inventory Health Dashboard</Text>
      <Text style={styles.tabIntro}>
        This view scans the full inventory mesh — across warehouses, stores and channels —
        to highlight risk, opportunity and slow movers.
      </Text>
      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Inventory Mesh</Text>
          <Text style={styles.cardText}>
            Live view of all SKUs by node, with low‑stock and excess‑stock heat overlays.
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SKU Velocity</Text>
          <Text style={styles.cardText}>
            Fast vs slow movers by store, with demand spikes and ageing buckets (30/60/90+ days).
          </Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Actions</Text>
        <Text style={styles.cardBullet}>• Predicts which SKUs will go OOS in the next 7–14 days.</Text>
        <Text style={styles.cardBullet}>• Flags slow‑moving SKUs that should be marked for sale.</Text>
        <Text style={styles.cardBullet}>
          • Highlights store‑to‑store transfers to unlock blocked working capital.
        </Text>
        <Text style={styles.cardBullet}>
          • Surfaces ageing items beyond 90 days for clearance or redistribution.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  tabTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  tabIntro: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardText: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 16,
  },
  cardBullet: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
});

export default InventoryTab;