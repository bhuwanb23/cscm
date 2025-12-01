import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RebalancingTab = () => {
  return (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Rebalancing & Optimal Allocation</Text>
      <Text style={styles.tabIntro}>
        Suggests how to move stock between stores and warehouses to reduce both stockouts and
        overstock, while respecting truck and route constraints.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Optimization Outputs</Text>
        <Text style={styles.cardBullet}>
          • Store‑to‑store transfers where one store is overstocked and another is at risk.
        </Text>
        <Text style={styles.cardBullet}>
          • Warehouse‑to‑store replenishments that keep service levels above target.
        </Text>
        <Text style={styles.cardBullet}>
          • Estimated cost savings and transfer gain potential (₹) per decision.
        </Text>
        <Text style={styles.cardBullet}>
          • Truck capacity and route feasibility check before recommending moves.
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
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardBullet: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 2,
  },
});

export default RebalancingTab;