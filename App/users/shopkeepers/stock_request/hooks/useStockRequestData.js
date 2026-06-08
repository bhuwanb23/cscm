import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPost } from '../../../../src/api/apiClient';
import { parsePrice } from '../../../../src/utils/parsePrice';
import { getStatusMeta } from '../../../../src/theme/status';
import { STOCK_REQUEST_CONSTANTS } from '../constants';

const SHOP_ID = 'SHOP-001';

function normalizeOrder(raw, index) {
  const meta = getStatusMeta(raw.status);
  const items = Array.isArray(raw.items) ? raw.items : [];
  const total = typeof raw.total_amount === 'number'
    ? raw.total_amount
    : items.reduce((sum, it) => sum + (Number(it.quantity || 0) * parsePrice(it.price)), 0);
  return {
    id: raw.order_id || raw.id || `${index}`,
    status,
    statusLabel: meta.statusLabel,
    statusColor: meta.statusColor,
    statusBgColor: meta.statusBgColor,
    date: raw.submitted_at || raw.created_at || raw.date || '',
    priority: raw.priority || 'normal',
    notes: raw.notes || '',
    items: items.map(it => ({
      name: it.name || it.sku_id || it.sku || 'Item',
      quantity: Number(it.quantity || 1),
      price: typeof it.price === 'number' ? `$${it.price.toFixed(2)}` : (it.price || ''),
    })),
    totalAmount: `$${total.toFixed(2)}`,
    deliveryDate: raw.delivery_date || raw.estimated_delivery || raw.deliveryDate || 'TBD',
    supplier: raw.supplier_id || raw.supplier || 'Mixed Suppliers',
  };
}

function normalizeRecommendation(raw, index) {
  return {
    id: raw.sku_id || raw.id || `REC-${index}`,
    name: raw.product_name || raw.name || 'Recommended item',
    description: raw.reason || raw.description || 'AI suggested reorder',
    reason: raw.reason || raw.description || 'AI suggested reorder',
    price: typeof raw.price === 'number' ? `$${raw.price.toFixed(2)}/unit` : (raw.price || ''),
    supplier: raw.supplier_id || raw.supplier || 'Recommended supplier',
    icon: raw.icon || 'sparkles-outline',
    iconColor: raw.iconColor || '#8B5CF6',
    iconBgColor: raw.iconBgColor || '#EDE9FE',
    category: raw.category || 'AI Recommended',
    currentStock: raw.current_stock || raw.currentStock || 0,
    reorderLevel: raw.reorder_level || raw.reorderLevel || 0,
    lastOrdered: raw.last_ordered || raw.lastOrdered || '',
  };
}

export const useStockRequestData = () => {
  const [activeTab, setActiveTab] = useState('new_request');
  const [selectedPriority, setSelectedPriority] = useState('low');
  const [selectedDelivery, setSelectedDelivery] = useState('same_day');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const orderHistory = useApiQuery('ORDERS_CRUD', 'listByStore', { params: { storeId: SHOP_ID } });
  const recommendations = useApiQuery('STORE', 'inventoryOptimization', { params: { storeId: SHOP_ID } });

  const requestHistory = useMemo(() => {
    if (orderHistory.data) {
      const raw = Array.isArray(orderHistory.data) ? orderHistory.data
        : Array.isArray(orderHistory.data.orders) ? orderHistory.data.orders
        : null;
      if (raw && raw.length > 0) return raw.map((r, i) => normalizeOrder(r, i));
    }
    return STOCK_REQUEST_CONSTANTS.REQUEST_HISTORY;
  }, [orderHistory.data]);

  const aiRecommendations = useMemo(() => {
    if (recommendations.data) {
      const raw = Array.isArray(recommendations.data) ? recommendations.data
        : Array.isArray(recommendations.data.recommendations) ? recommendations.data.recommendations
        : Array.isArray(recommendations.data.suggestions) ? recommendations.data.suggestions
        : null;
      if (raw && raw.length > 0) return raw.map((r, i) => normalizeRecommendation(r, i));
    }
    return STOCK_REQUEST_CONSTANTS.AI_RECOMMENDATIONS;
  }, [recommendations.data]);

  const filteredItems = useMemo(() => {
    const list = STOCK_REQUEST_CONSTANTS.SEARCHABLE_ITEMS;
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.supplier || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const addItem = useCallback((item) => {
    if (item.quantity < 0) {
      const existing = selectedItems.find(s => s.id === item.id);
      if (existing) {
        const newQuantity = existing.quantity + item.quantity;
        if (newQuantity <= 0) {
          setSelectedItems(prev => prev.filter(i => i.id !== item.id));
        } else {
          setSelectedItems(prev => prev.map(s => s.id === item.id ? { ...s, quantity: newQuantity } : s));
        }
      }
      return;
    }
    const existing = selectedItems.find(s => s.id === item.id);
    if (existing) {
      setSelectedItems(prev => prev.map(s => s.id === item.id ? { ...s, quantity: s.quantity + item.quantity } : s));
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: item.quantity }]);
    }
  }, [selectedItems]);

  const removeItem = useCallback((itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const updateItemQuantity = useCallback((itemId, quantity) => {
    if (quantity <= 0) {
      removeItem(itemId);
    } else {
      setSelectedItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity } : item));
    }
  }, [removeItem]);

  const addRecommendation = useCallback((recommendation) => {
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
  }, [addItem]);

  const getEstimatedDeliveryDate = useCallback((deliveryOption) => {
    const today = new Date();
    switch (deliveryOption) {
      case 'asap':
        return 'Within 2 hours';
      case 'same_day':
        return `Today by ${today.getHours() >= 12 ? '6 PM' : 'Closing'}`;
      case 'tomorrow': {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }
      case 'this_week':
        return 'Within 3-5 business days';
      case 'next_week':
        return 'Next week (Mon-Fri)';
      default:
        return 'TBD';
    }
  }, []);

  const submitRequest = useCallback(async () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item');
      return;
    }
    const totalValue = selectedItems.reduce((sum, item) => sum + (parsePrice(item.price) * item.quantity), 0);
    const localRequest = {
      id: Math.floor(100000 + Math.random() * 900000),
      priority: selectedPriority,
      delivery: selectedDelivery,
      items: selectedItems,
      timestamp: new Date().toISOString(),
      totalAmount: `$${totalValue.toFixed(2)}`,
      deliveryDate: getEstimatedDeliveryDate(selectedDelivery),
      supplier: 'Mixed Suppliers',
    };
    setSubmittedRequest(localRequest);
    setIsModalVisible(true);
    try {
      const body = {
        store_id: SHOP_ID,
        priority: selectedPriority,
        delivery_window: selectedDelivery,
        items: selectedItems.map(i => ({ sku_id: i.sku || i.id, name: i.name, quantity: i.quantity, price: parsePrice(i.price) })),
        total_amount: totalValue,
        notes: '',
      };
      await apiPost('/api/v1/orders', { body });
      orderHistory.refetch();
    } catch {
      // Demo: keep local optimistic state on failure
    }
  }, [selectedItems, selectedPriority, selectedDelivery, getEstimatedDeliveryDate, orderHistory]);

  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setSelectedItems([]);
    setSelectedPriority('low');
    setSelectedDelivery('same_day');
    setActiveTab('history');
  }, []);

  return {
    activeTab,
    selectedPriority,
    selectedDelivery,
    searchQuery,
    selectedItems,
    isModalVisible,
    submittedRequest,
    filteredItems,
    requestHistory,
    aiRecommendations,
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
    loading: orderHistory.loading || recommendations.loading,
    error: orderHistory.error || recommendations.error,
    refetch: () => { orderHistory.refetch(); recommendations.refetch(); },
  };
};
