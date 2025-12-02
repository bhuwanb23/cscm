import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
      <LinearGradient
        colors={['#EBF4FF', '#F8FAFC']}
        style={styles.backgroundGradient}
      />
      
      <View style={styles.header}>
        <LinearGradient
          colors={['#3B82F6', '#1E40AF']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, manage your store</Text>
        </LinearGradient>
      </View>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.section}>
            <QuickActions />
          </View>
          <View style={styles.section}>
            <StockLevels stockLevels={stockLevels} />
          </View>
          <View style={styles.section}>
            <PendingShipments shipments={shipments} />
          </View>
          <View style={styles.section}>
            <SalesChart />
          </View>
          <View style={styles.section}>
            <AlertsFeed alerts={alerts} />
          </View>
        </View>
      </ScrollView>
      <LiveIndicator isLive={isLive} />
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
  header: {
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#DBEAFE',
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 16,
  },
});

export default Dashboard;