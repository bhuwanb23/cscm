import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Header from './components/Header';
import BottomNavbar from './components/BottomNavbar';
import Dashboard from './dashboard/dashboard';
import Tasks from './tasks/tasks';
import Profile from './profile/profile';
import Navigation from './navigation/navigation';
import MeshConsole from '../mesh/mesh';
import DemoChip from '../../src/components/DemoChip';

const TransporterDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
  };

  const handleProfilePress = () => {
    setActiveTab('profile');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <LinearGradient colors={['#F8F9FA', '#E9ECEF']} style={styles.container}>
        <DemoChip />
        {activeTab === 'dashboard' ? (
          <Dashboard onLogout={onLogout} />
        ) : activeTab === 'tasks' ? (
          <Tasks onLogout={onLogout} />
        ) : activeTab === 'profile' ? (
          <Profile onLogout={onLogout} />
        ) : activeTab === 'navigation' ? (
          <Navigation onLogout={onLogout} />
        ) : activeTab === 'mesh' ? (
          <MeshConsole onLogout={onLogout} />
        ) : (
          <>
            <Header 
              title="Transporter Dashboard" 
              subtitle="Delivery Management" 
              onLogout={onLogout}
              onProfilePress={handleProfilePress}
            />
            <View style={styles.content}>
              <Text style={styles.pageTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Page</Text>
              <Text>This is the {activeTab} page content.</Text>
            </View>
          </>
        )}
        <BottomNavbar activeTab={activeTab} onTabPress={handleTabPress} />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

export default TransporterDashboard;