import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SHIPMENT_CONSTANTS } from '../constants';

const FilterTabs = ({ activeFilter, onFilterChange }) => {
  return (
    <View style={styles.container}>
      <View style={styles.tabsContainer}>
        {SHIPMENT_CONSTANTS.FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.tab,
              activeFilter === option.id
                ? { backgroundColor: option.activeColor }
                : { backgroundColor: option.inactiveColor },
            ]}
            onPress={() => onFilterChange(option.id)}
          >
            <Text
              style={[
                styles.tabText,
                activeFilter === option.id
                  ? { color: option.activeTextColor }
                  : { color: option.inactiveTextColor },
              ]}
            >
              {option.label} {option.count > 0 && `(${option.count})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default FilterTabs;
