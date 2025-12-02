import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MAP_HEIGHT = 140; // Reduced height for compact design

const MapView = ({ activeShipmentsCount = 4 }) => {
  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
        <View style={styles.mapHeader}>
          <View style={styles.headerLeft}>
            <Ionicons name="map" size={16} color="#3B82F6" />
            <Text style={styles.mapTitle}>Live Tracking</Text>
          </View>
          <View style={styles.activeIndicator}>
            <View style={styles.activeGradient}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>{activeShipmentsCount} Active</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.mapContainer}>
          <View style={styles.mapBackground}>
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
          </View>
        </View>
      </View>
    </View>
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#22C55E',
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
    backgroundColor: '#EBF4FF',
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