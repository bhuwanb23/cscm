import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TwinsTab = () => {
  return (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Digital Twin Explorer (Preview)</Text>
      <Text style={styles.tabIntro}>
        Future‑facing view of your virtual supply chain — product, store, region and warehouse twins.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Example Simulations</Text>
        <Text style={styles.cardBullet}>
          • "If we increase production by 20%, which nodes saturate first?"
        </Text>
        <Text style={styles.cardBullet}>
          • "If Store A closes for 5 days, what is the revenue and service‑level impact?"
        </Text>
        <Text style={styles.cardBullet}>
          • "If we get a 2x weekend spike, which SKUs / regions break first?"
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

export default TwinsTab;