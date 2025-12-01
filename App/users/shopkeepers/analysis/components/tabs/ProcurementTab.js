import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ProcurementTab = () => {
  return (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Procurement Simulation</Text>
      <Text style={styles.tabIntro}>
        Simulates POs under different demand and vendor lead‑time scenarios, with budget impact.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Procurement Signals</Text>
        <Text style={styles.cardBullet}>• Vendor‑wise lead times and reliability scores.</Text>
        <Text style={styles.cardBullet}>
          • Recommended PO quantities balancing MOQ vs forecast demand.
        </Text>
        <Text style={styles.cardBullet}>
          • Fabric / yarn / material demand forecast for upstream planning.
        </Text>
        <Text style={styles.cardBullet}>
          • Budget impact simulation when PO levels are increased or decreased.
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

export default ProcurementTab;