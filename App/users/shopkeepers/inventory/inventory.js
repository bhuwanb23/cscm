import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useInventoryData } from './hooks/useInventoryData';
import SearchBar from './components/SearchBar';
import FilterChips from './components/FilterChips';
import StatsSummary from './components/StatsSummary';
import InventoryList from './components/InventoryList';
import QuickUpdateModal from './components/QuickUpdateModal';
import ProductDetails from './components/ProductDetails';
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
    refetch,
  } = useInventoryData();

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  
  // No animations needed - components appear immediately

  const handleQuickUpdate = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleViewDetails = (item) => {
    setDetailItem(item);
    setDetailsVisible(true);
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

  const handleCloseDetails = () => {
    setDetailsVisible(false);
    setDetailItem(null);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EBF4FF', '#F8FAFC']}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.header}>
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>Manage your stock efficiently</Text>
        </LinearGradient>
      </View>

      <View style={styles.content}>
        <StatsSummary stats={stats} />
        
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={updateSearchQuery}
        />
        
        <FilterChips
          filters={INVENTORY_CONSTANTS.FILTER_OPTIONS}
          activeFilter={activeFilter}
          onFilterPress={updateActiveFilter}
        />
        
        <InventoryList
          items={filteredItems}
          onQuickUpdate={handleQuickUpdate}
          onViewDetails={handleViewDetails}
          onRefresh={refetch}
        />
      </View>
      
      <QuickUpdateModal
        visible={modalVisible}
        item={selectedItem}
        onClose={handleCloseModal}
        onUpdate={handleUpdateItem}
      />
      
      <ProductDetails
        item={detailItem}
        isVisible={detailsVisible}
        onClose={handleCloseDetails}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerGradient: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 1,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#DBEAFE',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
});

export default Inventory;