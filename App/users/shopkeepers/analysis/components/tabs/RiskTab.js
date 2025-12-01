import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RiskTab = () => {
  return (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Risk & Alerts Center</Text>
      <Text style={styles.tabIntro}>
        A single place where all risk signals converge — stock, vendor, logistics, API and demand.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Risk Types Monitored</Text>
        <Text style={styles.cardBullet}>• Stockout and overstock risk per SKU/node.</Text>
        <Text style={styles.cardBullet}>• Ageing inventory and write‑off exposure.</Text>
        <Text style={styles.cardBullet}>• Vendor delay probabilities and OTIF risk.</Text>
        <Text style={styles.cardBullet}>• API sync failures and SKU tampering risk.</Text>
        <Text style={styles.cardBullet}>
          • Seasonal spike warnings and early sales‑dip alerts.
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

export default RiskTab;