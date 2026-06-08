import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavbar from './components/BottomNavbar';
import Dashboard from './dashboard/dashboard';
import Orders from './orders/orders';
import Shipments from './shipments/shipments';
import Inventory from './inventory/inventory';
import Profile from './profile/profile';
import MeshConsole from '../mesh/mesh';
import DemoChip from '../../src/components/DemoChip';

const WholesalerDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabPress = (tabId) => setActiveTab(tabId);
  const handleProfilePress = () => setActiveTab('profile');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard onLogout={onLogout} />;
      case 'orders':
        return <Orders onLogout={onLogout} />;
      case 'shipments':
        return <Shipments onLogout={onLogout} />;
      case 'inventory':
        return <Inventory onLogout={onLogout} />;
      case 'mesh':
        return <MeshConsole onLogout={onLogout} />;
      case 'profile':
        return <Profile onLogout={onLogout} />;
      default:
        return <Dashboard onLogout={onLogout} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient colors={['#F8F9FA', '#E9ECEF']} style={styles.container}>
        <DemoChip />
        {renderContent()}
        <BottomNavbar activeTab={activeTab} onTabPress={handleTabPress} />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
});

export default WholesalerDashboard;
