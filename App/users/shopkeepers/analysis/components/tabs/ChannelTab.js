import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ChannelTab = () => {
  return (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Channel Sync & Availability Mesh</Text>
      <Text style={styles.tabIntro}>
        Keeps D2C, marketplaces and quick‑commerce channels in sync to avoid overselling or fake stock.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Channel Intelligence</Text>
        <Text style={styles.cardBullet}>
          • D2C vs marketplace stock comparison for each SKU and node.
        </Text>
        <Text style={styles.cardBullet}>
          • API sync health indicators to spot stale quantities or outages.
        </Text>
        <Text style={styles.cardBullet}>
          • Fake‑stock detection and overselling risk flags per SKU/channel combination.
        </Text>
        <Text style={styles.cardBullet}>
          • Quick‑commerce readiness score based on proximity and freshness.
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

export default ChannelTab;