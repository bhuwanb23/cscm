import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 140; // Reduced height for compact design

const MapView = ({ activeShipmentsCount = 4 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // Pulse animation for active indicator
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }
      ]}
    >
      <LinearGradient
        colors={['#FFFFFF', '#F8FAFC']}
        style={styles.gradientContainer}
      >
        <View style={styles.mapHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="map" size={16} color="#3B82F6" />
            <Text style={styles.mapTitle}>Live Tracking</Text>
          </View>
          <Animated.View 
            style={[
              styles.activeIndicator,
              {
                transform: [{ scale: pulseAnim }],
              }
            ]}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              style={styles.activeGradient}
            >
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>{activeShipmentsCount} Active</Text>
            </LinearGradient>
          </Animated.View>
        </View>
        
        <View style={styles.mapContainer}>
          <LinearGradient
            colors={['#EBF4FF', '#DBEAFE']}
            style={styles.mapBackground}
          >
            <Image
              source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b982481b6b-ed78231c110ab3c1f8ec.png' }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            <View style={styles.mapOverlay}>
              <Ionicons name="location" size={20} color="#EF4444" />
              <Ionicons name="location" size={16} color="#3B82F6" style={styles.locationIcon2} />
              <Ionicons name="location" size={18} color="#F59E0B" style={styles.locationIcon3} />
            </View>
          </LinearGradient>
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
    padding: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  activeIndicator: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  activeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  activeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  mapContainer: {
    height: MAP_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mapBackground: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationIcon2: {
    position: 'absolute',
    top: 20,
    left: -30,
  },
  locationIcon3: {
    position: 'absolute',
    bottom: 15,
    right: -25,
  },
});

export default MapView;
