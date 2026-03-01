import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Header from './components/Header';
import QuickStats from './components/QuickStats';
import NextTask from './components/NextTask';
import RouteProgress from './components/RouteProgress';
import AlertsSection from './components/AlertsSection';
import UpcomingStops from './components/UpcomingStops';

const Dashboard = ({ onLogout }) => {
  return (
    <View style={styles.container}>
      <Header 
        title="Driver Dashboard" 
        subtitle="Transporter Management" 
        onLogout={onLogout}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <QuickStats />
        <NextTask />
        <RouteProgress />
        <AlertsSection />
        <UpcomingStops />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
});

export default Dashboard;