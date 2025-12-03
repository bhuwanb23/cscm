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
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase()))
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
      category: recommendation.category || 'AI Recommended',
      description: recommendation.description,
      price: recommendation.price,
      supplier: recommendation.supplier,
      icon: recommendation.icon,
      iconColor: recommendation.iconColor,
      iconBgColor: recommendation.iconBgColor,
      sku: recommendation.sku,
      brand: recommendation.brand,
      shelfLife: recommendation.shelfLife,
    };
    addItem({ ...item, quantity: 1 });
  };

  // Submit request
  const submitRequest = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }
    
    // Calculate total value
    const totalValue = selectedItems.reduce((sum, item) => {
      if (item.price) {
        const price = parseFloat(item.price.replace(/[^0-9.-]+/g, ""));
        return sum + (price * item.quantity);
      }
      return sum;
    }, 0);
    
    // Create request object
    const request = {
      id: Math.floor(100000 + Math.random() * 900000),
      priority: selectedPriority,
      delivery: selectedDelivery,
      items: selectedItems,
      timestamp: new Date().toISOString(),
      totalAmount: `$${totalValue.toFixed(2)}`,
      deliveryDate: getEstimatedDeliveryDate(selectedDelivery),
      supplier: 'Mixed Suppliers', // In a real app, this would be determined based on items
    };
    
    // Simulate API call
    console.log('Submitting request:', request);
    
    setSubmittedRequest(request);
    setIsModalVisible(true);
  };

  // Get estimated delivery date based on selection
  const getEstimatedDeliveryDate = (deliveryOption) => {
    const today = new Date();
    switch (deliveryOption) {
      case 'asap':
        return 'Within 2 hours';
      case 'same_day':
        return `Today by ${today.getHours() >= 12 ? '6 PM' : 'Closing'}`;
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      case 'this_week':
        return 'Within 3-5 business days';
      case 'next_week':
        return 'Next week (Mon-Fri)';
      default:
        return 'TBD';
    }
  };

  // Close modal and reset form
  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedItems([]);
    setSelectedPriority('low');
    setSelectedDelivery('same_day');
    setActiveTab('history'); // Switch to history tab after submission
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