import { useState, useEffect } from 'react';
import { INVENTORY_CONSTANTS } from '../constants';

export const useInventoryData = () => {
  const [inventoryItems, setInventoryItems] = useState(INVENTORY_CONSTANTS.SAMPLE_INVENTORY);
  const [filteredItems, setFilteredItems] = useState(INVENTORY_CONSTANTS.SAMPLE_INVENTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [stats, setStats] = useState(INVENTORY_CONSTANTS.STATS_DATA);

  const filterItems = (items, filter, query) => {
    let filtered = [...items];

    // Apply search filter
    if (query.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.sku.toLowerCase().includes(query.toLowerCase()) ||
        item.supplier.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply category filter
    if (filter !== 'all') {
      switch (filter) {
        case 'low-stock':
          filtered = filtered.filter(item => item.status === 'low');
          break;
        case 'electronics':
          filtered = filtered.filter(item => item.type === 'Electronics');
          break;
        case 'clothing':
          filtered = filtered.filter(item => item.type === 'Clothing');
          break;
        case 'expired':
          filtered = filtered.filter(item => item.status === 'expiring');
          break;
        default:
          break;
      }
    }

    return filtered;
  };

  useEffect(() => {
    const filtered = filterItems(inventoryItems, activeFilter, searchQuery);
    setFilteredItems(filtered);
  }, [inventoryItems, activeFilter, searchQuery]);

  const updateSearchQuery = (query) => {
    setSearchQuery(query);
  };

  const updateActiveFilter = (filter) => {
    setActiveFilter(filter);
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    setInventoryItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const markItemAsDamaged = (itemId) => {
    setInventoryItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
      )
    );
  };

  const markItemAsExpired = (itemId) => {
    setInventoryItems(prevItems =>
      prevItems.map(item =>
        item.id === itemId ? { ...item, status: 'expired' } : item
      )
    );
  };

  return {
    inventoryItems,
    filteredItems,
    searchQuery,
    activeFilter,
    stats,
    updateSearchQuery,
    updateActiveFilter,
    updateItemQuantity,
    markItemAsDamaged,
    markItemAsExpired,
  };
};
