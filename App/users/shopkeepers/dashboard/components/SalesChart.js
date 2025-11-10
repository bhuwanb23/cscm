import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DASHBOARD_CONSTANTS } from '../constants';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - 32;
const CHART_HEIGHT = 120;
const BAR_WIDTH = (CHART_WIDTH - 40) / 7; // 7 days, with padding

const SalesChart = () => {
  const maxValue = Math.max(...DASHBOARD_CONSTANTS.CHART_DATA.data);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  const renderBar = (value, index) => {
    const height = (value / maxValue) * (CHART_HEIGHT - 40);
    return (
      <View key={index} style={styles.barContainer}>
        <View style={styles.barWrapper}>
          <LinearGradient
            colors={['#3B82F6', '#1E40AF']}
            style={[
              styles.bar,
              {
                height: height,
              },
            ]}
          />
        </View>
        <Text style={styles.dayLabel}>
          {DASHBOARD_CONSTANTS.CHART_DATA.categories[index]}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sales Analytics</Text>
      <Animated.View 
        style={[
          styles.chartContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <LinearGradient
          colors={['#FFFFFF', '#F8FAFC']}
          style={styles.chartGradient}
        >
          <View style={styles.chart}>
            {DASHBOARD_CONSTANTS.CHART_DATA.data.map((value, index) => renderBar(value, index))}
          </View>
          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Top Selling Items</Text>
            {DASHBOARD_CONSTANTS.TOP_SELLING_ITEMS.map((item, index) => (
              <Animated.View 
                key={index} 
                style={[
                  styles.legendItem,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateX: slideAnim }],
                  }
                ]}
              >
                <View style={styles.legendLeft}>
                  <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                  <Text style={styles.legendText}>{item.name}</Text>
                </View>
                <View style={styles.legendRight}>
                  <Text style={styles.legendValue}>{item.sold}</Text>
                  <Text style={styles.legendUnit}>sold</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
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
  chartContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  chartGradient: {
    padding: 12,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: CHART_HEIGHT,
    marginBottom: 12,
    paddingHorizontal: 6,
  },
  barContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barWrapper: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    width: BAR_WIDTH - 4,
    borderRadius: 4,
    marginBottom: 8,
  },
  dayLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  legend: {
    gap: 6,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  legendRight: {
    alignItems: 'flex-end',
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  legendUnit: {
    fontSize: 9,
    color: '#9CA3AF',
  },
});

export default SalesChart;
