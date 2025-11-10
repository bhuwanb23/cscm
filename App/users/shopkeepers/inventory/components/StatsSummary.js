import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const StatsSummary = ({ stats }) => {
  const fadeAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const slideAnims = useRef([
    new Animated.Value(20),
    new Animated.Value(20),
    new Animated.Value(20),
  ]).current;

  const statsData = [
    { value: stats.totalItems.toLocaleString(), label: 'Total Items', color: '#3B82F6' },
    { value: stats.lowStock, label: 'Low Stock', color: '#DC2626' },
    { value: stats.expiringSoon, label: 'Expiring Soon', color: '#EA580C' },
  ];

  useEffect(() => {
    const animations = statsData.map((_, index) => [
      Animated.timing(fadeAnims[index], {
        toValue: 1,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnims[index], {
        toValue: 0,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true,
      }),
    ]).flat();

    Animated.parallel(animations).start();
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
                opacity: fadeAnims[index],
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
    paddingVertical: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statWrapper: {
    flex: 1,
  },
  statItem: {
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default StatsSummary;
