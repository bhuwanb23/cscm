import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const DemandTab = () => {
  return (
    <View style={styles.tabSection}>
      <Text style={styles.tabTitle}>Demand Forecast Engine</Text>
      <Text style={styles.tabIntro}>
        Predictive curves for the next 7/14/30/60/90 days, with confidence bands and category colors.
      </Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Forecast Highlights</Text>
        <Text style={styles.cardBullet}>• Top 10 fast movers by uplift vs last week.</Text>
        <Text style={styles.cardBullet}>• Top 10 slow movers trending to markdown territory.</Text>
        <Text style={styles.cardBullet}>• Region‑wise demand maps to align supply with consumption.</Text>
        <Text style={styles.cardBullet}>
          • Confidence scores per item so planners know where to rely on AI vs use judgment.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Callouts</Text>
        <Text style={styles.cardBullet}>
          • "X SKUs will face OOS in 7 days if no action is taken."
        </Text>
        <Text style={styles.cardBullet}>
          • "Y SKUs predicted to spike by 120% this weekend — event / offer detected."
        </Text>
        <Text style={styles.cardBullet}>
          • "Z SKUs are trending on marketplace channels — check pricing and availability."
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

export default DemandTab;