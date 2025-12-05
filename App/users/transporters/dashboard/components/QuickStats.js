import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const QuickStats = () => {
  const handleStatPress = (statType) => {
    Alert.alert('Statistics', `Viewing details for ${statType}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <TouchableOpacity onPress={() => handleStatPress('Deliveries')} style={styles.statCardTouchable}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={styles.statHeader}>
                <View style={styles.iconContainer}>
                  <Ionicons name="cube-outline" size={20} color="#2563EB" />
                </View>
                <Text style={styles.statLabel}>Today</Text>
              </View>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statDescription}>Deliveries Pending</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBar, { width: '45%' }]} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => handleStatPress('Pickups')} style={styles.statCardTouchable}>
          <Card style={styles.statCard}>
            <View style={styles.statContent}>
              <View style={styles.statHeader}>
                <View style={[styles.iconContainer, styles.iconContainerSecondary]}>
                  <Ionicons name="cart-outline" size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statLabel}>Pickups</Text>
              </View>
              <Text style={styles.statValue}>4</Text>
              <Text style={styles.statDescription}>Scheduled Pickups</Text>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBar, styles.progressBarSecondary, { width: '25%' }]} />
              </View>
            </View>
          </Card>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardTouchable: {
    flex: 1,
  },
  statCard: {
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderRadius: 12,
  },
  statContent: {
    padding: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerSecondary: {
    backgroundColor: '#FEF3C7',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
  progressBarSecondary: {
    backgroundColor: '#F59E0B',
  },
});

export default QuickStats;