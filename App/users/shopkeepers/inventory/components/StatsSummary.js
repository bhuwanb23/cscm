import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const StatsSummary = ({ stats }) => {
  const slideAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  const statsData = [
    { value: stats.totalItems.toLocaleString(), label: 'Total Items', color: '#3B82F6' },
    { value: stats.lowStock, label: 'Low Stock', color: '#DC2626' },
    { value: stats.expiringSoon, label: 'Expiring Soon', color: '#EA580C' },
  ];

  useEffect(() => {
    // Start from visible state with subtle entrance animation
    slideAnims.forEach((anim, index) => {
      anim.setValue(-3);
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        delay: index * 30,
        useNativeDriver: true,
      }).start();
    });
  }, [stats]);

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <Animated.View
            key={index}
            style={[
              styles.statWrapper,
              {
                transform: [{ translateY: slideAnims[index] }],
              }
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.statItem}
            >
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.value}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </LinearGradient>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statWrapper: {
    flex: 1,
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 1,
  },
  statLabel: {
    fontSize: 9,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default StatsSummary;
