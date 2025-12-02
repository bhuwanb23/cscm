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
      message: 'Coca Cola 500ml - Only 5 units left in inventory. Please reorder immediately to avoid stockout.',
      priority: 'Critical',
      time: '2 min ago',
      color: 'danger',
      details: {
        product: 'Coca Cola 500ml',
        currentStock: 5,
        reorderLevel: 10,
        supplier: 'ABC Beverages'
      }
    },
    {
      id: 2,
      type: 'moderate',
      icon: 'truck',
      title: 'Shipment Delay',
      message: 'Order #1234 delayed by 2 hours. New estimated arrival: 3:30 PM today.',
      priority: 'Moderate',
      time: '15 min ago',
      color: 'warning',
      details: {
        orderId: '#1234',
        delayReason: 'Traffic congestion',
        newETA: '3:30 PM',
        driver: 'John Smith'
      }
    },
    {
      id: 3,
      type: 'suggestion',
      icon: 'lightbulb',
      title: 'AI Recommendation',
      message: 'Consider restocking chips - demand up 30% this week. Suggested order quantity: 50 units.',
      priority: 'Suggestion',
      time: '1 hour ago',
      color: 'info',
      details: {
        product: 'Potato Chips',
        demandIncrease: '30%',
        suggestedQuantity: 50,
        lastRestock: '2 weeks ago'
      }
    }
  ],
  
  MESSAGES: [
    {
      id: 1,
      name: 'Warehouse Manager',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg',
      lastMessage: 'Your order #1234 is ready for pickup. Please confirm pickup time.',
      unreadCount: 3,
      time: '10:30 AM',
      isOnline: true,
      details: {
        role: 'Warehouse Manager',
        lastSeen: 'online',
        responseTime: 'within 1 hour'
      }
    },
    {
      id: 2,
      name: 'Express Delivery',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-3.jpg',
      lastMessage: 'Delivery delayed due to traffic. ETA: 2 PM. Will notify when closer.',
      unreadCount: 2,
      time: '9:45 AM',
      isOnline: false,
      details: {
        company: 'Express Delivery Co.',
        contact: '+1 234 567 890',
        serviceArea: 'Metro City'
      }
    },
    {
      id: 3,
      name: 'Local Supplier',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-4.jpg',
      lastMessage: 'New stock available. Check our latest catalog for summer beverages collection.',
      unreadCount: 1,
      time: 'Yesterday',
      isOnline: true,
      details: {
        company: 'Local Supplier Inc.',
        products: 'Beverages & Snacks',
        rating: '4.8/5'
      }
    },
    {
      id: 4,
      name: 'Customer Support',
      avatar: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-8.jpg',
      lastMessage: 'Your support ticket #TKT-789 has been resolved. Please rate our service.',
      unreadCount: 1,
      time: '2 days ago',
      isOnline: false,
      details: {
        department: 'Customer Support',
        availability: 'Mon-Fri 9AM-6PM',
        avgResponseTime: '2 hours'
      }
    }
  ],
  
  QUICK_HELP: [
    {
      id: 1,
      icon: 'circle-question',
      title: 'How to request stock?',
      action: 'navigate',
      description: 'Learn how to create and submit stock requests to suppliers'
    },
    {
      id: 2,
      icon: 'truck',
      title: 'Track my shipment',
      action: 'navigate',
      description: 'Track real-time location and status of your shipments'
    },
    {
      id: 3,
      icon: 'headset',
      title: 'Contact support',
      action: 'navigate',
      description: 'Get help from our customer support team 24/7'
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