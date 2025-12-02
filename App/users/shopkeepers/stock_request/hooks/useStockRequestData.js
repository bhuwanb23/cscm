import { useState, useMemo } from 'react';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

export const useStockRequestData = () => {
  const [activeTab, setActiveTab] = useState('new_request');
  const [selectedPriority, setSelectedPriority] = useState('low');
  const [selectedDelivery, setSelectedDelivery] = useState('same_day');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  // Filter searchable items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery) return STOCK_REQUEST_CONSTANTS.SEARCHABLE_ITEMS;
    
    return STOCK_REQUEST_CONSTANTS.SEARCHABLE_ITEMS.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  // Add item to selected items
  const addItem = (item) => {
    // If quantity is negative, we're decreasing
    if (item.quantity < 0) {
      const existingItem = selectedItems.find(selected => selected.id === item.id);
      if (existingItem) {
        const newQuantity = existingItem.quantity + item.quantity;
        if (newQuantity <= 0) {
          removeItem(item.id);
        } else {
          setSelectedItems(prev => 
            prev.map(selected => 
              selected.id === item.id 
                ? { ...selected, quantity: newQuantity }
                : selected
            )
          );
        }
      }
      return;
    }
    
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(prev => 
        prev.map(selected => 
          selected.id === item.id 
            ? { ...selected, quantity: selected.quantity + item.quantity }
            : selected
        )
      );
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: item.quantity }]);
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
      description: recommendation.description,
      price: recommendation.price,
      supplier: recommendation.supplier,
      icon: recommendation.icon,
      iconColor: recommendation.iconColor,
      iconBgColor: recommendation.iconBgColor,
    };
    addItem({ ...item, quantity: 1 });
  };

  // Submit request
  const submitRequest = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }
    
    // Create request object
    const request = {
      id: Math.floor(100000 + Math.random() * 900000),
      priority: selectedPriority,
      delivery: selectedDelivery,
      items: selectedItems,
      timestamp: new Date().toISOString(),
    };
    
    // Simulate API call
    console.log('Submitting request:', request);
    
    setSubmittedRequest(request);
    setIsModalVisible(true);
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedItems([]);
    setSelectedPriority('low');
    setSelectedDelivery('same_day');
  };

  return {
    // State
    activeTab,
    selectedPriority,
    selectedDelivery,
    searchQuery,
    selectedItems,
    isModalVisible,
    submittedRequest,
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