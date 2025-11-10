import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const MapToggle = ({ isEnabled, onToggle }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const thumbAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    Animated.timing(thumbAnim, {
      toValue: isEnabled ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isEnabled]);

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
        <View style={styles.content}>
          <View style={styles.labelContainer}>
            <Ionicons name="map" size={16} color="#3B82F6" style={styles.icon} />
            <Text style={styles.label}>Map View</Text>
          </View>
          <TouchableOpacity
            style={styles.toggle}
            onPress={onToggle}
            activeOpacity={0.8}
          >
            {isEnabled ? (
              <LinearGradient
                colors={['#3B82F6', '#1E40AF']}
                style={styles.toggleTrack}
              >
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{
                        translateX: thumbAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [2, 18],
                        }),
                      }],
                    }
                  ]}
                />
              </LinearGradient>
            ) : (
              <View style={styles.toggleInactive}>
                <Animated.View
                  style={[
                    styles.toggleThumb,
                    {
                      transform: [{
                        translateX: thumbAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [2, 18],
                        }),
                      }],
                    }
                  ]}
                />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 4,
  },
  gradientContainer: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  toggle: {
    width: 36,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  toggleTrack: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  toggleInactive: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D1D5DB',
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

export default MapToggle;
