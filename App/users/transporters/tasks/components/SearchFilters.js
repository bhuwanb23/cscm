import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchFilters = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  const filterChips = [
    { id: 'all', label: 'All Tasks' },
    { id: 'highPriority', label: 'High Priority' },
    { id: 'pickups', label: 'Pickups' },
    { id: 'deliveries', label: 'Deliveries' },
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      Alert.alert('Search', `Searching for: ${searchQuery}`);
    }
  };

  const handleFilterPress = (filterId) => {
    setActiveFilter(filterId);
    Alert.alert('Filter Applied', `Filter set to: ${filterChips.find(f => f.id === filterId)?.label || filterId}`);
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search order ID, address, or customer..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.filterButton} onPress={handleSearch}>
            <Ionicons name="filter" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.chipsContainer}
        contentContainerStyle={styles.chipsContent}
      >
        {filterChips.map((chip) => (
          <TouchableOpacity 
            key={chip.id}
            style={[
              styles.chip, 
              activeFilter === chip.id ? styles.activeChip : styles.inactiveChip
            ]}
            onPress={() => handleFilterPress(chip.id)}
          >
            <Text style={[
              styles.chipText,
              activeFilter === chip.id ? styles.activeChipText : styles.inactiveChipText
            ]}>
              {chip.label}
            </Text>
            {chip.id === 'highPriority' && (
              <Text style={styles.priorityDot}>•</Text>
            )}
            {chip.id === 'pickups' && (
              <Ionicons name="cube-outline" size={14} color="#2563EB" style={styles.chipIcon} />
            )}
            {chip.id === 'deliveries' && (
              <Ionicons name="trail-sign-outline" size={14} color="#10B981" style={styles.chipIcon} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 16,
    paddingBottom: 8,
    paddingHorizontal: 20,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    paddingLeft: 12,
    paddingRight: 12,
    paddingVertical: 14,
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'System',
  },
  filterButton: {
    padding: 12,
  },
  chipsContainer: {
    flexGrow: 0,
  },
  chipsContent: {
    flexDirection: 'row',
    paddingBottom: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
  },
  activeChip: {
    backgroundColor: '#1E293B',
    borderColor: '#1E293B',
  },
  inactiveChip: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeChipText: {
    color: '#FFFFFF',
  },
  inactiveChipText: {
    color: '#64748B',
  },
  priorityDot: {
    color: '#EF4444',
    marginLeft: 4,
    fontSize: 16,
  },
  chipIcon: {
    marginLeft: 4,
  },
});

export default SearchFilters;