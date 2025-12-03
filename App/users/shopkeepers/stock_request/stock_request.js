import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
} from 'react-native';
import { useStockRequestData } from './hooks/useStockRequestData';
import TabNavigation from './components/TabNavigation';
import AIRecommendations from './components/AIRecommendations';
import PrioritySelector from './components/PrioritySelector';
import ItemSearch from './components/ItemSearch';
import DeliverySchedule from './components/DeliverySchedule';
import SelectedItems from './components/SelectedItems';
import RequestHistory from './components/RequestHistory';
import ConfirmationModal from './components/ConfirmationModal';

const StockRequest = () => {
  const {
    activeTab,
    selectedPriority,
    selectedDelivery,
    searchQuery,
    selectedItems,
    isModalVisible,
    submittedRequest,
    filteredItems,
    setActiveTab,
    setSelectedPriority,
    setSelectedDelivery,
    setSearchQuery,
    addItem,
    removeItem,
    updateItemQuantity,
    addRecommendation,
    submitRequest,
    closeModal,
  } = useStockRequestData();

  const scrollViewRef = useRef();

  // Scroll to top when switching tabs
  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  }, [activeTab]);

  const renderNewRequest = () => (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.scrollView} 
      showsVerticalScrollIndicator={false}
    >
      <AIRecommendations onAddRecommendation={addRecommendation} />
      <PrioritySelector 
        selectedPriority={selectedPriority} 
        onPrioritySelect={setSelectedPriority} 
      />
      <ItemSearch
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredItems={filteredItems}
        onAddItem={addItem}
      />
      <DeliverySchedule 
        selectedDelivery={selectedDelivery} 
        onDeliverySelect={setSelectedDelivery} 
      />
      <SelectedItems
        selectedItems={selectedItems}
        onRemoveItem={removeItem}
        onSubmitRequest={submitRequest}
      />
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.scrollView}
      showsVerticalScrollIndicator={false}
    >
      <RequestHistory />
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Stock Request</Text>
          <Text style={styles.headerSubtitle}>Request inventory items efficiently</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === 'new_request' ? renderNewRequest() : renderHistory()}
      </View>
      
      <ConfirmationModal 
        isVisible={isModalVisible} 
        onClose={closeModal} 
        submittedRequest={submittedRequest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginTop: 10,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
  },
  headerContainer: {
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
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
});

export default StockRequest;