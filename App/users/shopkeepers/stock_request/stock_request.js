import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
          <Text style={styles.headerTitle}>Stock Request</Text>
          <Text style={styles.headerSubtitle}>Request inventory items efficiently</Text>
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
        <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {activeTab === 'new_request' ? renderNewRequest() : renderHistory()}
      </Animated.View>
      
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
  scrollView: {
    flex: 1,
    paddingBottom: 20,
  },
});

export default StockRequest;
