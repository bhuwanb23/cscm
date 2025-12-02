import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SHIPMENT_CONSTANTS } from '../constants';

const FilterTabs = ({ activeFilter, onFilterChange }) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {SHIPMENT_CONSTANTS.FILTER_OPTIONS.map((option, index) => (
          <View
            key={option.id}
            style={styles.tabWrapper}
          >
            <TouchableOpacity
              style={styles.tab}
              onPress={() => onFilterChange(option.id)}
              activeOpacity={0.8}
            >
              {activeFilter === option.id ? (
                <View 
                  style={[styles.activeTab, { backgroundColor: option.activeColor }]}
                >
                  <Text style={[styles.tabText, { color: option.activeTextColor }]}>
                    {option.label} {option.count > 0 && `(${option.count})`}
                  </Text>
                </View>
              ) : (
                <View style={[styles.inactiveTab, { backgroundColor: option.inactiveColor }]}>
                  <Text style={[styles.tabText, { color: option.inactiveTextColor }]}>
                    {option.label} {option.count > 0 && `(${option.count})`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tabWrapper: {
    flex: 1,
  },
  tab: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  activeTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  inactiveTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

export default FilterTabs;