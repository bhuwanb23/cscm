import React from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Components
import Header from './components/Header';
import QuickStats from './components/QuickStats';
import AlertsSection from './components/AlertsSection';
import MessagesSection from './components/MessagesSection';
import QuickHelpSection from './components/QuickHelpSection';
import BottomNavbar from './components/BottomNavbar';
import FloatingChatButton from './components/FloatingChatButton';

// Hooks and Constants
import { useCommunicationData } from './hooks/useCommunicationData';
import { COMMUNICATION_CONSTANTS, COLORS } from './constants';

const Communication = () => {
  const {
    quickStats,
    alerts,
    messages,
    quickHelp,
    loading,
    refreshData,
    markAlertAsRead,
    markMessageAsRead,
    getUnreadCount,
    getActiveAlertsCount
  } = useCommunicationData();

  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'You have new notifications');
  };

  const handleProfilePress = () => {
    Alert.alert('Profile', 'Profile settings');
  };

  const handleAlertPress = (alert) => {
    markAlertAsRead(alert.id);
    Alert.alert('Alert Details', alert.message);
  };

  const handleViewAllAlerts = () => {
    Alert.alert('All Alerts', 'Viewing all alerts');
  };

  const handleMessagePress = (message) => {
    markMessageAsRead(message.id);
    Alert.alert('Message', `Opening chat with ${message.name}`);
  };

  const handleNewChat = () => {
    Alert.alert('New Chat', 'Starting new conversation');
  };

  const handleHelpItemPress = (item) => {
    Alert.alert('Help', `Opening help for: ${item.title}`);
  };

  const handleViewAllHelp = () => {
    Alert.alert('All Help', 'Viewing all help topics');
  };

  const handleNavItemPress = (item) => {
    if (item.id === 'messages') return; // Already on messages page
    Alert.alert('Navigation', `Navigating to ${item.label}`);
  };

  const handleFloatingChatPress = () => {
    Alert.alert('Quick Chat', 'Starting quick chat');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.app}>
        <Header 
          unreadCount={getUnreadCount()}
          onNotificationPress={handleNotificationPress}
          onProfilePress={handleProfilePress}
        />
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <QuickStats stats={quickStats} />
          
          <AlertsSection 
            alerts={alerts}
            onAlertPress={handleAlertPress}
            onViewAllPress={handleViewAllAlerts}
          />
          
          <MessagesSection 
            messages={messages}
            onMessagePress={handleMessagePress}
            onNewChatPress={handleNewChat}
          />
          
          <QuickHelpSection 
            helpItems={quickHelp}
            onHelpItemPress={handleHelpItemPress}
            onViewAllPress={handleViewAllHelp}
          />
        </ScrollView>
        
        <BottomNavbar 
          navItems={COMMUNICATION_CONSTANTS.BOTTOM_NAV_ITEMS}
          onNavItemPress={handleNavItemPress}
        />
        
        <FloatingChatButton 
          onPress={handleFloatingChatPress}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  app: {
    flex: 1,
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
    backgroundColor: 'white',
    minHeight: '100%',
  },
  scrollView: {
    flex: 1,
    paddingBottom: 80, // Space for bottom navbar
  },
});

export default Communication;
