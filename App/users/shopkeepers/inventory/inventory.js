import React, { useState } from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import { useInventoryData } from './hooks/useInventoryData';
import SearchBar from './components/SearchBar';
import FilterChips from './components/FilterChips';
import StatsSummary from './components/StatsSummary';
import InventoryList from './components/InventoryList';
import QuickUpdateModal from './components/QuickUpdateModal';
import { INVENTORY_CONSTANTS } from './constants';

const Inventory = () => {
  const {
    filteredItems,
    searchQuery,
    activeFilter,
    stats,
    updateSearchQuery,
    updateActiveFilter,
    updateItemQuantity,
    markItemAsDamaged,
    markItemAsExpired,
  } = useInventoryData();

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleQuickUpdate = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleViewDetails = (item) => {
    // Navigate to item details page
    console.log('View details for:', item.name);
  };

  const handleUpdateItem = (itemId, newQuantity, status) => {
    if (status === 'expired') {
      markItemAsExpired(itemId);
    } else {
      updateItemQuantity(itemId, newQuantity);
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  return (
    <View style={styles.container}>
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={updateSearchQuery}
      />
      
      <FilterChips
        filters={INVENTORY_CONSTANTS.FILTER_OPTIONS}
        activeFilter={activeFilter}
        onFilterPress={updateActiveFilter}
      />
      
      <StatsSummary stats={stats} />
      
      <InventoryList
        items={filteredItems}
        onQuickUpdate={handleQuickUpdate}
        onViewDetails={handleViewDetails}
      />
      
      <QuickUpdateModal
        visible={modalVisible}
        item={selectedItem}
        onClose={handleCloseModal}
        onUpdate={handleUpdateItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
});

export default Inventory;
