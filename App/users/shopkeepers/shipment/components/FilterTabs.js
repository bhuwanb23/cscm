import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SHIPMENT_CONSTANTS } from '../constants';

const FilterTabs = ({ activeFilter, onFilterChange }) => {
  const fadeAnims = useRef(
    SHIPMENT_CONSTANTS.FILTER_OPTIONS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = SHIPMENT_CONSTANTS.FILTER_OPTIONS.map((_, index) =>
      Animated.timing(fadeAnims[index], {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      })
    );
    
    Animated.parallel(animations).start();
  }, []);

  return (
    <LinearGradient
      colors={['#FFFFFF', '#F8FAFC']}
      style={styles.container}
    >
      <View style={styles.tabsContainer}>
        {SHIPMENT_CONSTANTS.FILTER_OPTIONS.map((option, index) => (
          <Animated.View
            key={option.id}
            style={[
              styles.tabWrapper,
              {
                opacity: fadeAnims[index],
                transform: [{
                  scale: fadeAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                }],
              }
            ]}
          >
            <TouchableOpacity
              style={styles.tab}
              onPress={() => onFilterChange(option.id)}
              activeOpacity={0.8}
            >
              {activeFilter === option.id ? (
                <LinearGradient
                  colors={[option.activeColor, `${option.activeColor}CC`]}
                  style={styles.activeTabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.tabText, { color: option.activeTextColor }]}>
                    {option.label} {option.count > 0 && `(${option.count})`}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.inactiveTab, { backgroundColor: option.inactiveColor }]}>
                  <Text style={[styles.tabText, { color: option.inactiveTextColor }]}>
                    {option.label} {option.count > 0 && `(${option.count})`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tabWrapper: {
    flex: 1,
  },
  tab: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeTabGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  inactiveTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default FilterTabs;
