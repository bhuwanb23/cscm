import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid-outline' },
  { id: 'orders', label: 'Orders', icon: 'cart-outline' },
  { id: 'shipments', label: 'Shipments', icon: 'car-outline' },
  { id: 'inventory', label: 'Inventory', icon: 'cube-outline' },
  { id: 'mesh', label: 'Mesh', icon: 'globe-outline' },
  { id: 'profile', label: 'Profile', icon: 'person-outline' },
];

const BottomNavbar = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tab}
            onPress={() => onTabPress && onTabPress(tab.id)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.icon.replace('-outline', '') : tab.icon}
              size={22}
              color={isActive ? '#3B82F6' : '#6B7280'}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 8,
    paddingBottom: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  label: { fontSize: 10, color: '#6B7280', marginTop: 2, fontWeight: '500' },
  labelActive: { color: '#3B82F6', fontWeight: '700' },
});

export default BottomNavbar;
