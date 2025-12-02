export const PROFILE_CONSTANTS = {
  SETTINGS_OPTIONS: [
    { id: 1, title: 'Account Settings', icon: 'person-outline' },
    { id: 2, title: 'Notification Preferences', icon: 'notifications-outline' },
    { id: 3, title: 'Payment Methods', icon: 'card-outline' },
    { id: 4, title: 'Security', icon: 'lock-closed-outline' },
    { id: 5, title: 'Help & Support', icon: 'help-circle-outline' },
  ],
};

export const DEFAULT_USER_DATA = {
  name: 'John Doe',
  email: 'john.doe@store.com',
  phone: '+1 234 567 8900',
  storeName: 'Fresh Market',
  storeId: 'ST-12345',
  address: '123 Main Street, City, State 12345',
  memberSince: 'January 2022',
  totalOrders: 128,
  totalSpent: '$12,450',
  loyaltyPoints: 1250,
};

export const RECENT_ACTIVITY = [
  { id: 1, action: 'Stock request submitted', time: '2 hours ago', status: 'Pending' },
  { id: 2, action: 'Shipment received', time: '1 day ago', status: 'Completed' },
  { id: 3, action: 'Inventory updated', time: '2 days ago', status: 'Completed' },
  { id: 4, action: 'Analysis report generated', time: '3 days ago', status: 'Completed' },
];