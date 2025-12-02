import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const QuickStats = ({ stats }) => {
  const { unread, alerts, active } = stats;
  
  const statsData = [
    { label: 'Unread', value: unread, icon: 'mail-unread', color: '#EF4444' },
    { label: 'Alerts', value: alerts, icon: 'notifications', color: '#F59E0B' },
    { label: 'Active', value: active, icon: 'pulse', color: '#22C55E' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
        <View style={styles.statsGrid}>
          {statsData.map((stat, index) => (
            <View
              key={stat.label}
              style={styles.statWrapper}
            >
              <View style={styles.statCard}>
                <View style={[styles.iconContainer, { backgroundColor: `${stat.color}20` }]}>
                  <Ionicons name={stat.icon} size={16} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  gradientContainer: {
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statWrapper: {
    flex: 1,
  },
  statCard: {
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
});

export default QuickStats;
