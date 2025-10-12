import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const NavItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity 
      style={styles.navItem}
      onPress={() => onPress(item)}
    >
      <View style={styles.navIconContainer}>
        <Ionicons 
          name={item.icon} 
          size={20} 
          color={item.active ? COLORS.primary : COLORS.gray[400]} 
        />
        {item.badge && item.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>
      <Text style={[
        styles.navLabel,
        { color: item.active ? COLORS.primary : COLORS.gray[400] }
      ]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

const BottomNavbar = ({ navItems, onNavItemPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.navContent}>
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            onPress={onNavItemPress}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: COLORS.gray[200],
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxWidth: 400,
    alignSelf: 'center',
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: 8,
  },
  navIconContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default BottomNavbar;
