import { useCallback, useMemo, useState } from 'react';
import { useApiQuery } from '../../../../src/api/useApiQuery';
import { apiPut } from '../../../../src/api/apiClient';

const WHOLESALER_ID = 'WHOLE-001';

const DEFAULT_INVENTORY = [
  { id: 'W-001', name: 'Basmati Rice', sku: 'RIC-BAS-50', quantity: 240, reorder_point: 100, category: 'Grains', price: 28.50 },
  { id: 'W-002', name: 'Sunflower Oil', sku: 'OIL-SUN-15', quantity: 12, reorder_point: 50, category: 'Oils', price: 42.00 },
  { id: 'W-003', name: 'Sugar', sku: 'SUG-REF-25', quantity: 180, reorder_point: 80, category: 'Sweeteners', price: 18.75 },
  { id: 'W-004', name: 'Tea Bags', sku: 'TEA-BAG-100', quantity: 8, reorder_point: 30, category: 'Beverages', price: 65.00 },
];

function normalizeItem(raw, index) {
  return {
    id: raw.sku_id || raw.id || `W-${index}`,
    name: raw.product_name || raw.name || 'Item',
    sku: raw.sku_id || raw.sku || `SKU-${index}`,
    quantity: Number(raw.quantity || raw.on_hand || 0),
    reorder_point: Number(raw.reorder_point || 0),
    category: raw.category || 'General',
    price: Number(raw.price || raw.unit_price || 0),
  };
}

export const useInventoryData = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const inventory = useApiQuery('INVENTORY_CRUD', 'listByStore', { params: { storeId: WHOLESALER_ID } });

  const items = useMemo(() => {
    if (inventory.data) {
      const raw = Array.isArray(inventory.data) ? inventory.data
        : Array.isArray(inventory.data.items) ? inventory.data.items
        : null;
      if (raw && raw.length > 0) return raw.map((r, i) => normalizeItem(r, i));
    }
    return DEFAULT_INVENTORY;
  }, [inventory.data]);

  const filtered = useMemo(() => {
    let result = items;
    if (activeFilter === 'low-stock') result = result.filter(i => i.quantity <= i.reorder_point);
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(i => (i.name || '').toLowerCase().includes(q) || (i.sku || '').toLowerCase().includes(q));
    }
    return result;
  }, [items, activeFilter, searchQuery]);

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    try { await apiPut(`/api/v1/inventory/${WHOLESALER_ID}/${encodeURIComponent(itemId)}/quantity`, { body: { quantity: newQuantity } }); inventory.refetch(); } catch {}
  }, [inventory]);

  return {
    items: filtered,
    counts: { all: items.length, lowStock: items.filter(i => i.quantity <= i.reorder_point).length },
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    updateQuantity,
    loading: inventory.loading,
    error: inventory.error,
    refetch: inventory.refetch,
  };
};
