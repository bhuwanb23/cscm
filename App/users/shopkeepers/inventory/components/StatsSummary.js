import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

const StatsSummary = ({ stats }) => {
  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalItems.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.lowStockValue]}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.expiringValue]}>{stats.expiringSoon}</Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  lowStockValue: {
    color: '#DC2626',
  },
  expiringValue: {
    color: '#EA580C',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default StatsSummary;
