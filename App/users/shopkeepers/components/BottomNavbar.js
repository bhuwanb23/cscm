import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BottomNavbar = ({ activeTab, onTabPress }) => {
  const tabs = [
    { id: 'dashboard', icon: 'home-outline', activeIcon: 'home' },
    { id: 'analysis', icon: 'pulse-outline', activeIcon: 'pulse' },
    { id: 'inventory', icon: 'list-outline', activeIcon: 'list' },
    { id: 'orders', icon: 'add-circle-outline', activeIcon: 'add-circle' },
    { id: 'shipments', icon: 'car-outline', activeIcon: 'car' },
    { id: 'mesh', icon: 'globe-outline', activeIcon: 'globe' },
    // Removed messages tab as it's now in the header
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.navbar}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => onTabPress(tab.id)}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={24}
                color={isActive ? '#4A90E2' : '#7F8C8D'}
              />
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
  navbar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
  },
  activeTab: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: 8,
  },
  activeIndicator: {
    position: 'absolute',
    top: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4A90E2',
  },
});

export default BottomNavbar;