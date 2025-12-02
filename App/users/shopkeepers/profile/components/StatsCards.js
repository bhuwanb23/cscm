import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StatsCards = ({ userData }) => {
  return (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{userData.totalOrders}</Text>
        <Text style={styles.statLabel}>Total Orders</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{userData.loyaltyPoints}</Text>
        <Text style={styles.statLabel}>Loyalty Points</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statValue}>{userData.totalSpent}</Text>
        <Text style={styles.statLabel}>Total Spent</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '32%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});

export default StatsCards;