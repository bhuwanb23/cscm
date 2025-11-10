import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const PrioritySelector = ({ selectedPriority, onPrioritySelect }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnims = useRef(
    STOCK_REQUEST_CONSTANTS.PRIORITY_LEVELS.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animations = [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      ...STOCK_REQUEST_CONSTANTS.PRIORITY_LEVELS.map((_, index) =>
        Animated.timing(buttonAnims[index], {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true,
        })
      ),
    ];
    
    Animated.parallel(animations).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{
            scale: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.95, 1],
            }),
          }],
        }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.gradientContainer}
      >
        <Text style={styles.title}>Priority Level</Text>
        <View style={styles.priorityOptions}>
          {STOCK_REQUEST_CONSTANTS.PRIORITY_LEVELS.map((priority, index) => {
            const isSelected = selectedPriority === priority.id;
            return (
              <Animated.View
                key={priority.id}
                style={[
                  styles.buttonWrapper,
                  {
                    opacity: buttonAnims[index],
                    transform: [{
                      scale: buttonAnims[index].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    }],
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.priorityButton}
                  onPress={() => onPrioritySelect(priority.id)}
                  activeOpacity={0.8}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={[priority.activeColor, priority.activeBorderColor]}
                      style={styles.activeButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons
                        name={priority.icon}
                        size={14}
                        color={priority.activeTextColor}
                        style={styles.priorityIcon}
                      />
                      <Text style={[styles.priorityText, { color: priority.activeTextColor }]}>
                        {priority.label}
                      </Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.inactiveButton, { backgroundColor: priority.inactiveColor }]}>
                      <Ionicons
                        name={priority.icon}
                        size={14}
                        color={priority.inactiveTextColor}
                        style={styles.priorityIcon}
                      />
                      <Text style={[styles.priorityText, { color: priority.inactiveTextColor }]}>
                        {priority.label}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
  },
  gradientContainer: {
    borderRadius: 12,
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 6,
  },
  buttonWrapper: {
    flex: 1,
  },
  priorityButton: {
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  inactiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  priorityIcon: {
    marginRight: 4,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default PrioritySelector;
