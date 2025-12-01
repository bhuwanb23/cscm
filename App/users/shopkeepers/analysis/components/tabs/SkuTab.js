import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SkuTab = () => {
  return (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>SKU Performance Intelligence</Text>
      <Text style={styles.tabIntro}>
        Digital twin view for every SKU, including lifecycle stage, margin, returns and sell‑through.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lifecycle & Performance</Text>
        <Text style={styles.cardBullet}>• Stage classification: New / Growth / Peak / Decline.</Text>
        <Text style={styles.cardBullet}>
          • Style‑level and variant‑level performance to avoid blind reorders.
        </Text>
        <Text style={styles.cardBullet}>
          • Margin contribution and sell‑through heatmaps by store/region.
        </Text>
        <Text style={styles.cardBullet}>
          • Return‑rate analytics to trigger quality investigations.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Actions</Text>
        <Text style={styles.cardBullet}>
          • "SKU X has 70% sell‑through and should be reordered."
        </Text>
        <Text style={styles.cardBullet}>
          • "SKU Y has 18% return rate — quality check and supplier review needed."
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

export default SkuTab;