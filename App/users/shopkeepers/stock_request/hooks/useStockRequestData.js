import { useState, useMemo } from 'react';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

export const useStockRequestData = () => {
  const [activeTab, setActiveTab] = useState('new_request');
  const [selectedPriority, setSelectedPriority] = useState('normal');
  const [selectedDelivery, setSelectedDelivery] = useState('asap');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Filter searchable items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return STOCK_REQUEST_CONSTANTS.SEARCHABLE_ITEMS;
    
    return STOCK_REQUEST_CONSTANTS.SEARCHABLE_ITEMS.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Add item to selected items
  const addItem = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(selected => 
          selected.id === item.id 
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      );
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  // Remove item from selected items
  const removeItem = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateItemQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      setSelectedItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  // Add AI recommendation
  const addRecommendation = (recommendation) => {
    const item = {
      id: recommendation.id,
      name: recommendation.name,
      category: 'AI Recommended',
      icon: recommendation.icon,
      iconColor: recommendation.iconColor,
      iconBgColor: recommendation.iconBgColor,
    };
    addItem(item);
  };

  // Submit request
  const submitRequest = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }
    
    // Simulate API call
    console.log('Submitting request:', {
      priority: selectedPriority,
      delivery: selectedDelivery,
      items: selectedItems,
    });
    
    setIsModalVisible(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedItems([]);
    setSelectedPriority('normal');
    setSelectedDelivery('asap');
  };

  return {
    // State
    activeTab,
    selectedPriority,
    selectedDelivery,
    searchQuery,
    selectedItems,
    isModalVisible,
    filteredItems,
    
    // Actions
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
  };
};
