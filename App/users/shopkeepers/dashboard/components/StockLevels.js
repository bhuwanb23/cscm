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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  cardWrapper: {
    flex: 1,
  },
  card: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  indicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  count: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  unit: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    width: '100%',
  },
});

export default StockLevels;
