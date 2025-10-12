import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useDashboardData } from './hooks/useDashboardData';
import QuickActions from './components/QuickActions';
import StockLevels from './components/StockLevels';
import PendingShipments from './components/PendingShipments';
import SalesChart from './components/SalesChart';
import AlertsFeed from './components/AlertsFeed';
import LiveIndicator from './components/LiveIndicator';

const Dashboard = () => {
  const { stockLevels, shipments, alerts, isLive } = useDashboardData();

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <QuickActions />
        <StockLevels stockLevels={stockLevels} />
        <PendingShipments shipments={shipments} />
        <SalesChart />
        <AlertsFeed alerts={alerts} />
      </ScrollView>
      <LiveIndicator isLive={isLive} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});

export default Dashboard;
