import { useState, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { ANALYSIS_MODULES } from '../constants';

export const useAnalysis = () => {
  const [status, setStatus] = useState('idle'); // idle | running | done
  const [activeTab, setActiveTab] = useState('Inventory Health');
  const [metrics, setMetrics] = useState({
    stockoutRisk: 18,
    overstockValue: 24.5,
    revenueLost: 3.2,
    skuHealth: 82,
    forecastAccuracy: 91,
    workingCapital: 47.3,
    demandSpikes: 6,
    inventoryTurnover: 9.1,
    transferGain: 1.4,
  });
  const [moduleProgress, setModuleProgress] = useState(
    ANALYSIS_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: 0 }), {}),
  );
  const [insights, setInsights] = useState([]);

  const runAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation;
    if (status === 'running') {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(runAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(runAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      runAnim.setValue(0);
    }
    
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [status]);

  const startAnalysis = () => {
    if (status === 'running') return;

    setStatus('running');
    setModuleProgress(ANALYSIS_MODULES.reduce((acc, m) => ({ ...acc, [m.id]: 3 }), {}));
    setInsights([]);

    ANALYSIS_MODULES.forEach((m, index) => {
      setTimeout(() => {
        setModuleProgress(prev => ({
          ...prev,
          [m.id]: 100,
        }));
      }, 800 * (index + 1));
    });

    setTimeout(() => {
      setMetrics({
        stockoutRisk: 21,
        overstockValue: 26.9,
        revenueLost: 2.7,
        skuHealth: 84,
        forecastAccuracy: 92,
        workingCapital: 45.1,
        demandSpikes: 8,
        inventoryTurnover: 9.4,
        transferGain: 1.9,
      });
      setInsights([
        'SKU X is selling 3x faster in Bangalore; transfer 20 units from Chennai.',
        'Weekend spike of 2.1x expected on beverages; increase PO by 18%.',
        'Ageing inventory in Warehouse B: 43 SKUs beyond 90 days.',
        '16 SKUs not synced across D2C, Meesho, Amazon – channel risk.',
      ]);
      setStatus('done');
    }, 800 * (ANALYSIS_MODULES.length + 2));
  };

  const runScale = runAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  return {
    status,
    activeTab,
    metrics,
    moduleProgress,
    insights,
    runScale,
    setActiveTab,
    startAnalysis,
  };
};