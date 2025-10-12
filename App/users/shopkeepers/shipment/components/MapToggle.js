import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const MapToggle = ({ isEnabled, onToggle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Real-time Map View</Text>
      <TouchableOpacity
        style={[
          styles.toggle,
          isEnabled && styles.toggleActive,
        ]}
        onPress={onToggle}
      >
        <View
          style={[
            styles.toggleThumb,
            isEnabled && styles.toggleThumbActive,
          ]}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  toggle: {
    width: 44,
    height: 24,
    backgroundColor: '#D1D5DB',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#2563EB',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
});

export default MapToggle;
