import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DASHBOARD_CONSTANTS } from '../constants';

const StockLevels = ({ stockLevels }) => {
  const levels = [
    {
      key: 'good',
      count: stockLevels.good,
      ...DASHBOARD_CONSTANTS.STOCK_LEVELS.GOOD,
    },
    {
      key: 'low',
      count: stockLevels.low,
      ...DASHBOARD_CONSTANTS.STOCK_LEVELS.LOW,
    },
    {
      key: 'critical',
      count: stockLevels.critical,
      ...DASHBOARD_CONSTANTS.STOCK_LEVELS.CRITICAL,
    },
  ];

  const slideAnims = useRef(
    levels.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Start from visible state with subtle entrance animation
    slideAnims.forEach((anim, index) => {
      anim.setValue(-5);
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        delay: index * 30,
        useNativeDriver: true,
      }).start();
    });
  }, [stockLevels]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stock Levels</Text>
      <View style={styles.grid}>
        {levels.map((level, index) => (
          <Animated.View
            key={level.key}
            style={[
              styles.cardWrapper,
              {
                transform: [{ translateY: slideAnims[index] }],
              },
            ]}
          >
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.indicator, { backgroundColor: level.color }]} />
                <Text style={styles.label}>{level.label}</Text>
              </View>
              <Text style={styles.count}>
                {level.count}
              </Text>
              <Text style={styles.unit}>Items</Text>
              <View style={[styles.progressBar, { backgroundColor: `${level.color}20` }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: level.color,
                      width: `${Math.min((level.count / 100) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            </LinearGradient>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  count: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  unit: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    width: '100%',
  },
});

export default StockLevels;