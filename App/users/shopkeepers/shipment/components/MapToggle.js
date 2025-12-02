import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MapToggle = ({ isEnabled, onToggle }) => {
  return (
    <View style={styles.container}>
      <View style={styles.gradientContainer}>
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
              <View style={styles.toggleTrack}>
                <View style={styles.toggleThumbEnabled} />
              </View>
            ) : (
              <View style={styles.toggleInactive}>
                <View style={styles.toggleThumb} />
              </View>
            )}
          </TouchableOpacity>
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
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#3B82F6',
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
    marginLeft: 2,
  },
  toggleThumbEnabled: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginLeft: 18,
  },
});

export default MapToggle;