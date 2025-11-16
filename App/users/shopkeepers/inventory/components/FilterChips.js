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
  const scaleAnims = useRef(
    filters.map(() => new Animated.Value(1))
  ).current;

  useEffect(() => {
    // Start from visible state with subtle entrance animation
    scaleAnims.forEach((anim, index) => {
      anim.setValue(0.98);
      Animated.timing(anim, {
        toValue: 1,
        duration: 150,
        delay: index * 25,
        useNativeDriver: true,
      }).start();
    });
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
                transform: [{ scale: scaleAnims[index] }],
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
    paddingVertical: 4,
  },
  scrollContent: {
    paddingRight: 16,
  },
  chipWrapper: {
    marginRight: 6,
  },
  chip: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
  },
  activeChipGradient: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inactiveChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F3F4F6',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#374151',
  },
  activeChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FilterChips;
