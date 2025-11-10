import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      <LinearGradient
        colors={['#EBF4FF', '#F8FAFC']}
        style={styles.backgroundGradient}
      />
      
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Inventory</Text>
          <Text style={styles.headerSubtitle}>Manage your stock efficiently</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
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
        />
      </Animated.View>
      
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
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#DBEAFE',
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
});

export default Inventory;
