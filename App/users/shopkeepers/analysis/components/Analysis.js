import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Header from './Header';
import ActionBar from './ActionBar';
import ModuleProgress from './ModuleProgress';
import MetricCard from './MetricCard';
import Tabs from './Tabs';
import InsightsFeed from './InsightsFeed';
import InventoryTab from './tabs/InventoryTab';
import DemandTab from './tabs/DemandTab';
import RebalancingTab from './tabs/RebalancingTab';
import ChannelTab from './tabs/ChannelTab';
import SkuTab from './tabs/SkuTab';
import ProcurementTab from './tabs/ProcurementTab';
import RiskTab from './tabs/RiskTab';
import TwinsTab from './tabs/TwinsTab';
import { useAnalysis } from '../hooks/useAnalysis';

const Analysis = () => {
  const {
    status,
    activeTab,
    metrics,
    moduleProgress,
    insights,
    runScale,
    setActiveTab,
    startAnalysis,
  } = useAnalysis();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'Inventory Health':
        return <InventoryTab />;
      case 'Demand Forecast':
        return <DemandTab />;
      case 'Rebalancing':
        return <RebalancingTab />;
      case 'Channel Sync':
        return <ChannelTab />;
      case 'SKU Intelligence':
        return <SkuTab />;
      case 'Procurement':
        return <ProcurementTab />;
      case 'Risk & Alerts':
        return <RiskTab />;
      case 'Digital Twins Explorer':
        return <TwinsTab />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EBF4FF', '#F8FAFC']}
        style={styles.backgroundGradient}
      />

      <Header />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
          <ActionBar 
            runScale={runScale} 
            onStartAnalysis={startAnalysis} 
            status={status} 
          />

          <ModuleProgress moduleProgress={moduleProgress} />

          {/* Summary metrics row */}
          <View style={styles.metricsRow}>
            <MetricCard metricKey="stockoutRisk" value={metrics.stockoutRisk} />
            <MetricCard metricKey="overstockValue" value={metrics.overstockValue} />
            <MetricCard metricKey="revenueLost" value={metrics.revenueLost} />
            <MetricCard metricKey="skuHealth" value={metrics.skuHealth} />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard metricKey="forecastAccuracy" value={metrics.forecastAccuracy} />
            <MetricCard metricKey="workingCapital" value={metrics.workingCapital} />
            <MetricCard metricKey="demandSpikes" value={metrics.demandSpikes} />
            <MetricCard metricKey="transferGain" value={metrics.transferGain} />
          </View>

          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main tab content */}
          {renderActiveTab()}

          <InsightsFeed insights={insights} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  metricsRow: {
    paddingHorizontal: 16,
    paddingTop: 6,
    flexDirection: 'row',
    gap: 6,
  },
});

export default Analysis;