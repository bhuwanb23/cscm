import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InsightsFeed = ({ insights }) => {
  return (
    <View style={styles.insightsSection}>
      <Text style={styles.insightsTitle}>AI Insights Feed</Text>
      <Text style={styles.insightsIntro}>
        Real‑time narrative of what the mesh is seeing — demand shifts, risks, and recommended moves.
      </Text>
      {(insights.length ? insights : [
        'Run analysis to generate live insights from sample data.',
      ]).map((msg, idx) => (
        <View key={`${idx}-${msg}`} style={styles.insightCard}>
          <View style={styles.insightIconWrap}>
            <Ionicons name="bulb-outline" size={16} color="#FBBF24" />
          </View>
          <View style={styles.insightTextWrap}>
            <Text style={styles.insightLabel}>AI Insight #{idx + 1}</Text>
            <Text style={styles.insightText}>{msg}</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  insightsSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 16,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  insightsIntro: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 8,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 6,
  },
  insightIconWrap: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  insightTextWrap: {
    flex: 1,
  },
  insightLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  insightText: {
    fontSize: 12,
    color: '#111827',
  },
});

export default InsightsFeed;