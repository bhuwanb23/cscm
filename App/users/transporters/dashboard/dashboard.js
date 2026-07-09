import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Header from './components/Header';
import QuickStats from './components/QuickStats';
import NextTask from './components/NextTask';
import RouteProgress from './components/RouteProgress';
import AlertsSection from './components/AlertsSection';
import UpcomingStops from './components/UpcomingStops';
import { useDashboardData } from './hooks/useDashboardData';

const Dashboard = ({ onLogout }) => {
  const { quickStats, nextTask, routeProgress, dashboardAlerts, upcomingStops, startRoute, acknowledgeAlert, refetch, loading } = useDashboardData();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Driver Dashboard"
        subtitle="Transporter Management"
        onLogout={onLogout}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        <QuickStats data={quickStats} />
        <NextTask data={nextTask} onStartRoute={(t) => startRoute(t.id)} />
        <RouteProgress data={routeProgress} />
        <AlertsSection data={dashboardAlerts} onAlertPress={(a) => acknowledgeAlert(a.id)} />
        <UpcomingStops data={upcomingStops} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1, padding: 16 },
});

export default Dashboard;
