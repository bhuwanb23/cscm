import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants';

const QuickStats = ({ stats }) => {
  const { unread, alerts, active } = stats;

  return (
    <LinearGradient
      colors={[COLORS.primary, '#2563eb']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Unread</Text>
          <Text style={styles.statValue}>{unread}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Alerts</Text>
          <Text style={styles.statValue}>{alerts}</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statValue}>{active}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backdropFilter: 'blur(4px)',
  },
  statLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default QuickStats;
