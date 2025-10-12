export const COMMUNICATION_CONSTANTS = {
  QUICK_STATS: {
    UNREAD: 7,
    ALERTS: 3,
    ACTIVE: 12
  },
  
  ALERTS: [
    {
      id: 1,
      type: 'critical',
      icon: 'triangle-exclamation',
      title: 'Low Stock Warning',
      message: 'Coca Cola 500ml - Only 5 units left',
      priority: 'Critical',
      time: '2 min ago',
      color: 'danger'
    },
    {
      id: 2,
      type: 'moderate',
      icon: 'truck',
      title: 'Shipment Delay',
      message: 'Order #1234 delayed by 2 hours',
      priority: 'Moderate',
      time: '15 min ago',
      color: 'warning'
    },
    {
      id: 3,
      type: 'suggestion',
      icon: 'lightbulb',
      title: 'AI Recommendation',
      message: 'Consider restocking chips - demand up 30%',
      priority: 'Suggestion',
      time: '1 hour ago',
      color: 'info'
    }
  ],
  
  MESSAGES: [
    {
      id: 1,
      name: 'Warehouse Manager',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      lastMessage: 'Your order #1234 is ready for pickup...',
      unreadCount: 3,
      time: '10:30 AM',
      isOnline: true
    },
    {
      id: 2,
      name: 'Express Delivery',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
      lastMessage: 'Delivery delayed due to traffic. ETA: 2 PM',
      unreadCount: 2,
      time: '9:45 AM',
      isOnline: false
    },
    {
      id: 3,
      name: 'Local Supplier',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
      lastMessage: 'New stock available. Check our latest...',
      unreadCount: 1,
      time: 'Yesterday',
      isOnline: true
    },
    {
      id: 4,
      name: 'Customer Support',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg',
      lastMessage: 'Your support ticket has been resolved',
      unreadCount: 1,
      time: '2 days ago',
      isOnline: false
    }
  ],
  
  QUICK_HELP: [
    {
      id: 1,
      icon: 'circle-question',
      title: 'How to request stock?',
      action: 'navigate'
    },
    {
      id: 2,
      icon: 'truck',
      title: 'Track my shipment',
      action: 'navigate'
    },
    {
      id: 3,
      icon: 'headset',
      title: 'Contact support',
      action: 'navigate'
    }
  ],
  
  BOTTOM_NAV_ITEMS: [
    {
      id: 'home',
      icon: 'house',
      label: 'Home',
      active: false
    },
    {
      id: 'inventory',
      icon: 'box',
      label: 'Inventory',
      active: false
    },
    {
      id: 'messages',
      icon: 'comments',
      label: 'Messages',
      active: true,
      badge: 7
    },
    {
      id: 'reports',
      icon: 'chart-bar',
      label: 'Reports',
      active: false
    },
    {
      id: 'settings',
      icon: 'gear',
      label: 'Settings',
      active: false
    }
  ]
};

export const COLORS = {
  primary: '#2563eb',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

export const ALERT_TYPES = {
  CRITICAL: 'critical',
  MODERATE: 'moderate',
  SUGGESTION: 'suggestion'
};

export const MESSAGE_STATUS = {
  ONLINE: 'online',
  OFFLINE: 'offline'
};
