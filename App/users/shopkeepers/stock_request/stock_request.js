import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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

  const renderNewRequest = () => (
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
    <RequestHistory />
  );

  return (
    <View style={styles.container}>
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {activeTab === 'new_request' ? renderNewRequest() : renderHistory()}
      
      <ConfirmationModal 
        isVisible={isModalVisible} 
        onClose={closeModal} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
});

export default StockRequest;
