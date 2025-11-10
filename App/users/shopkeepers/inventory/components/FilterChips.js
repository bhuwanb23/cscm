import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const FilterChips = ({ filters, activeFilter, onFilterPress }) => {
  const fadeAnims = useRef(
    filters.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = filters.map((_, index) =>
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
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter, index) => (
          <Animated.View
            key={filter.id}
            style={[
              styles.chipWrapper,
              {
                opacity: fadeAnims[index],
                transform: [{
                  scale: fadeAnims[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  }),
                }],
              }
            ]}
          >
            <TouchableOpacity
              style={styles.chip}
              onPress={() => onFilterPress(filter.id)}
              activeOpacity={0.8}
            >
              {activeFilter === filter.id ? (
                <LinearGradient
                  colors={['#3B82F6', '#1E40AF']}
                  style={styles.activeChipGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.activeChipText}>
                    {filter.label}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={styles.inactiveChip}>
                  <Text style={styles.chipText}>
                    {filter.label}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  scrollContent: {
    paddingRight: 16,
  },
  chipWrapper: {
    marginRight: 8,
  },
  chip: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeChipGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inactiveChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  activeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FilterChips;
