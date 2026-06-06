import { useCallback, useEffect, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { INVENTORY_CONSTANTS } from '../constants';

const SHOP_ID = 'SHOP-001';

function normalizeItem(raw, index) {
  const qty = Number(raw.quantity ?? raw.on_hand ?? 0);
  const reorder = Number(raw.reorder_point ?? raw.safety_stock ?? 0);
  let status = 'in-stock';
  let borderColor = null;
  if (qty <= 0) { status = 'low'; borderColor = '#EF4444'; }
  else if (qty <= reorder) { status = 'low'; borderColor = '#EF4444'; }
  return {
    id: raw.sku_id || raw.id || `ITEM-${index}`,
    name: raw.product_name || raw.name || raw.sku_id || 'Unnamed item',
    sku: raw.sku_id || raw.sku || `SKU-${index}`,
    supplier: raw.supplier_id || raw.supplier || 'Unknown',
    quantity: qty,
    status,
    type: raw.category || raw.subcategory || 'General',
    expiryDate: raw.expiry_date || raw.expiryDate || null,
    borderColor,
    category: raw.category || 'General',
    price: Number(raw.price ?? raw.unit_price ?? 0),
    cost: Number(raw.cost ?? 0),
    lastUpdated: raw.last_updated || raw.lastUpdated || null,
    location: raw.location || 'Unassigned',
    description: raw.description || '',
    weight: raw.weight || null,
    dimensions: raw.dimensions || null,
  };
}

function filterItems(items, filter, query) {
  let filtered = [...items];
  if (query && query.trim()) {
    const q = query.toLowerCase();
    filtered = filtered.filter(item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.sku || '').toLowerCase().includes(q) ||
      (item.supplier || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
    );
  }
  if (filter && filter !== 'all') {
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
      case 'audio':
        filtered = filtered.filter(item => item.category === 'Audio');
        break;
      case 'expired':
        filtered = filtered.filter(item => item.status === 'expiring');
        break;
      default:
        break;
    }
  }
  return filtered;
}

export const useInventoryData = () => {
  const inventory = useApiQuery('INVENTORY_CRUD', 'listByStore', { params: { storeId: SHOP_ID } });
  const [localItems, setLocalItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const apiItems = useMemo(() => {
    if (!inventory.data) return null;
    const raw = Array.isArray(inventory.data) ? inventory.data
      : Array.isArray(inventory.data.items) ? inventory.data.items
      : null;
    if (!raw) return null;
    return raw.map((r, i) => normalizeItem(r, i));
  }, [inventory.data]);

  const inventoryItems = apiItems || localItems.length > 0 ? localItems : INVENTORY_CONSTANTS.SAMPLE_INVENTORY;
  const filteredItems = useMemo(
    () => filterItems(inventoryItems, activeFilter, searchQuery),
    [inventoryItems, activeFilter, searchQuery]
  );

  const stats = useMemo(() => {
    const totalItems = inventoryItems.length;
    const lowStock = inventoryItems.filter(i => i.status === 'low').length;
    const expiringSoon = inventoryItems.filter(i => i.status === 'expiring').length;
    return { totalItems, lowStock, expiringSoon };
  }, [inventoryItems]);

  const updateSearchQuery = useCallback((query) => setSearchQuery(query), []);
  const updateActiveFilter = useCallback((filter) => setActiveFilter(filter), []);

  const updateItemQuantity = useCallback((itemId, newQuantity) => {
    setLocalItems(prev => prev.length === 0
      ? INVENTORY_CONSTANTS.SAMPLE_INVENTORY.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i)
      : prev.map(i => i.id === itemId ? { ...i, quantity: newQuantity } : i));
  }, []);

  const markItemAsDamaged = useCallback((itemId) => {
    setLocalItems(prev => prev.length === 0
      ? INVENTORY_CONSTANTS.SAMPLE_INVENTORY.map(i => i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i)
      : prev.map(i => i.id === itemId ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i));
  }, []);

  const markItemAsExpired = useCallback((itemId) => {
    setLocalItems(prev => prev.length === 0
      ? INVENTORY_CONSTANTS.SAMPLE_INVENTORY.map(i => i.id === itemId ? { ...i, status: 'expired' } : i)
      : prev.map(i => i.id === itemId ? { ...i, status: 'expired' } : i));
  }, []);

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
    loading: inventory.loading,
    error: inventory.error,
    refetch: inventory.refetch,
  };
};
