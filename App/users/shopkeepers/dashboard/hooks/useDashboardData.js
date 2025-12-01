import { useState, useEffect, useRef } from 'react';

const ANALYSIS_STEPS = [
  { id: 'cart', label: 'Scan live carts & wishlists' },
  { id: 'inventory', label: 'Compare on-hand vs demand' },
  { id: 'supply', label: 'Check supplier SLAs' },
];

const SAMPLE_CART_ANALYTICS = [
  {
    sku: 'SKU-1001',
    name: 'Electro-Lite Headphones',
    category: 'Electronics',
    cartDemand: 48,
    currentInventory: 18,
    safetyStock: 12,
    unitPrice: 89,
    supplier: 'Alpha Audio',
    leadTimeDays: 2,
  },
  {
    sku: 'SKU-2040',
    name: 'Heritage House Blend Coffee',
    category: 'Grocery',
    cartDemand: 62,
    currentInventory: 20,
    safetyStock: 15,
    unitPrice: 14,
    supplier: 'Origin Harvest',
    leadTimeDays: 5,
  },
  {
    sku: 'SKU-3055',
    name: 'Everyday Essentials Paper Towels',
    category: 'Household',
    cartDemand: 35,
    currentInventory: 9,
    safetyStock: 8,
    unitPrice: 11,
    supplier: 'Purely Goods',
    leadTimeDays: 7,
  },
  {
    sku: 'SKU-4102',
    name: 'Sustain Kids Sneakers',
    category: 'Apparel',
    cartDemand: 22,
    currentInventory: 6,
    safetyStock: 6,
    unitPrice: 54,
    supplier: 'Stride Labs',
    leadTimeDays: 4,
  },
  {
    sku: 'SKU-5021',
    name: 'FreshBox Organic Lettuce Pack',
    category: 'Produce',
    cartDemand: 28,
    currentInventory: 14,
    safetyStock: 12,
    unitPrice: 6,
    supplier: 'GreenFly Farms',
    leadTimeDays: 1,
  },
];

const getInitialSteps = () => ANALYSIS_STEPS.map(step => ({ ...step, completed: false }));

const performCartAnalysis = () => {
  const flagged = [];
  let totalRevenueRisk = 0;
  let totalShortfall = 0;
  let totalLeadTime = 0;
  const categorySet = new Set();

  SAMPLE_CART_ANALYTICS.forEach(item => {
    const targetInventory = item.cartDemand + item.safetyStock;
    const shortfall = Math.max(targetInventory - item.currentInventory, 0);
    if (shortfall <= 0) {
      return;
    }

    const severity = shortfall / targetInventory;
    let action = 'Schedule replenishment';
    if (severity > 0.45) {
      action = 'Expedite supplier PO';
    } else if (item.leadTimeDays > 4) {
      action = 'Switch to backup supplier';
    } else if (severity > 0.25) {
      action = 'Create transfer order';
    }

    flagged.push({
      ...item,
      targetInventory,
      shortfall,
      severity,
      action,
      priority: severity > 0.45 ? 'Critical' : severity > 0.25 ? 'High' : 'Medium',
    });

    totalRevenueRisk += shortfall * item.unitPrice;
    totalShortfall += shortfall;
    totalLeadTime += item.leadTimeDays;
    categorySet.add(item.category);
  });

  flagged.sort((a, b) => b.severity - a.severity);

  const summary = {
    itemsScanned: SAMPLE_CART_ANALYTICS.length,
    cartSessions: 148,
    flaggedCount: flagged.length,
    shortfallUnits: totalShortfall,
    revenueRisk: totalRevenueRisk,
    avgLeadTime: flagged.length ? totalLeadTime / flagged.length : 0,
    categoriesImpacted: Array.from(categorySet),
    riskLevel: flagged.length > 3 ? 'High' : flagged.length > 0 ? 'Elevated' : 'Stable',
  };

  return { summary, recommendations: flagged };
};

export const useDashboardData = () => {
  const [stockLevels] = useState({
    good: 124,
    low: 18,
    critical: 7,
  });

  const [shipments] = useState([
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

  const [alerts] = useState([
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
  const [analysisState, setAnalysisState] = useState({
    status: 'idle',
    steps: getInitialSteps(),
    summary: null,
    recommendations: [],
    startedAt: null,
    completedAt: null,
  });

  const timersRef = useRef([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 3000);

    return () => {
      clearInterval(interval);
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const queueTimeout = (callback, delay) => {
    const id = setTimeout(() => {
      callback();
      timersRef.current = timersRef.current.filter(timerId => timerId !== id);
    }, delay);
    timersRef.current.push(id);
  };

  const startAnalysis = () => {
    if (analysisState.status === 'running') {
      return;
    }

    setAnalysisState({
      status: 'running',
      steps: getInitialSteps(),
      summary: null,
      recommendations: [],
      startedAt: new Date().toISOString(),
      completedAt: null,
    });

    ANALYSIS_STEPS.forEach((_, index) => {
      queueTimeout(() => {
        setAnalysisState(prev => ({
          ...prev,
          steps: prev.steps.map((step, stepIdx) =>
            stepIdx === index ? { ...step, completed: true } : step
          ),
        }));
      }, (index + 1) * 800);
    });

    queueTimeout(() => {
      const results = performCartAnalysis();
      setAnalysisState(prev => ({
        ...prev,
        status: 'completed',
        summary: results.summary,
        recommendations: results.recommendations,
        completedAt: new Date().toISOString(),
      }));
    }, (ANALYSIS_STEPS.length + 1) * 800);
  };

  return {
    stockLevels,
    shipments,
    alerts,
    isLive,
    analysisState,
    startAnalysis,
  };
};
