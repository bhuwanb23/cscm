import { useState, useEffect } from 'react';

export const useDashboardData = () => {
  const [stockLevels, setStockLevels] = useState({
    good: 124,
    low: 18,
    critical: 7,
  });

  const [shipments, setShipments] = useState([
    {
      id: 'SH001',
      items: 'Electronics & Accessories',
      eta: 'Today, 3:00 PM',
      status: 'In Transit',
    },
    {
      id: 'SH002',
      items: 'Home & Garden',
      eta: 'Tomorrow, 10:00 AM',
      status: 'Preparing',
    },
  ]);

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: 'critical',
      title: 'Critical Stock Level',
      message: 'iPhone 14 cases below minimum threshold',
      time: '2 minutes ago',
    },
    {
      id: 2,
      type: 'warning',
      title: 'Delivery Delay',
      message: 'Shipment #SH003 delayed by 2 hours',
      time: '15 minutes ago',
    },
    {
      id: 3,
      type: 'success',
      title: 'Stock Replenished',
      message: 'Wireless headphones restocked successfully',
      time: '1 hour ago',
    },
  ]);

  const [isLive, setIsLive] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return {
    stockLevels,
    shipments,
    alerts,
    isLive,
  };
};
