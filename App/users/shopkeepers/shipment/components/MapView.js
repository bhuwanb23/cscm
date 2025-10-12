import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const MAP_HEIGHT = 192; // 12rem equivalent

const MapView = ({ activeShipmentsCount = 4 }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EFF6FF', '#DBEAFE']}
        style={styles.mapContainer}
      >
        <Image
          source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/b982481b6b-ed78231c110ab3c1f8ec.png' }}
          style={styles.mapImage}
          resizeMode="cover"
        />
        <View style={styles.activeIndicator}>
          <Text style={styles.activeText}>{activeShipmentsCount} Active</Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  mapContainer: {
    height: MAP_HEIGHT,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default MapView;
