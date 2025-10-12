export const INVENTORY_CONSTANTS = {
  FILTER_OPTIONS: [
    { id: 'all', label: 'All Items', active: true },
    { id: 'low-stock', label: 'Low Stock', active: false },
    { id: 'electronics', label: 'Electronics', active: false },
    { id: 'clothing', label: 'Clothing', active: false },
    { id: 'expired', label: 'Expired', active: false },
  ],
  
  STOCK_STATUS: {
    LOW: { color: '#EF4444', bgColor: '#FEE2E2', textColor: '#DC2626', label: 'Low Stock' },
    IN_STOCK: { color: '#22C55E', bgColor: '#D1FAE5', textColor: '#16A34A', label: 'In Stock' },
    EXPIRING: { color: '#F97316', bgColor: '#FED7AA', textColor: '#EA580C', label: 'Expires Soon' },
  },
  
  ITEM_TYPES: {
    ELECTRONICS: 'Electronics',
    CLOTHING: 'Clothing',
    FOOD: 'Food',
    ACCESSORIES: 'Accessories',
  },
  
  STATS_DATA: {
    totalItems: 1247,
    lowStock: 23,
    expiringSoon: 7,
  },
  
  SAMPLE_INVENTORY: [
    {
      id: 1,
      name: 'MacBook Pro 16"',
      sku: 'MBP16-001',
      supplier: 'Apple Inc.',
      quantity: 3,
      status: 'low',
      type: 'Electronics',
      expiryDate: null,
      borderColor: '#EF4444',
    },
    {
      id: 2,
      name: 'iPhone 15 Pro',
      sku: 'IP15P-128',
      supplier: 'Apple Inc.',
      quantity: 47,
      status: 'in-stock',
      type: 'Electronics',
      expiryDate: null,
      borderColor: null,
    },
    {
      id: 3,
      name: 'Organic Milk 1L',
      sku: 'MLK-ORG-1L',
      supplier: 'Fresh Farms Co.',
      quantity: 24,
      status: 'expiring',
      type: 'Food',
      expiryDate: 'Dec 15',
      borderColor: '#F97316',
    },
    {
      id: 4,
      name: 'Samsung Galaxy S24',
      sku: 'SGS24-256',
      supplier: 'Samsung',
      quantity: 32,
      status: 'in-stock',
      type: 'Electronics',
      expiryDate: null,
      borderColor: null,
    },
    {
      id: 5,
      name: 'Nike Air Max 270',
      sku: 'NAM270-42',
      supplier: 'Nike Inc.',
      quantity: 18,
      status: 'in-stock',
      type: 'Clothing',
      expiryDate: null,
      borderColor: null,
    },
  ],
  
  SWIPE_ACTIONS: {
    EDIT: { color: '#3B82F6', icon: 'create-outline' },
    ALERT: { color: '#EF4444', icon: 'warning-outline' },
    EXPIRY: { color: '#F97316', icon: 'time-outline' },
  },
};
