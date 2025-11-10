import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Components
import Header from './components/Header';
import QuickStats from './components/QuickStats';
import AlertsSection from './components/AlertsSection';
import MessagesSection from './components/MessagesSection';
import QuickHelpSection from './components/QuickHelpSection';
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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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


  const handleFloatingChatPress = () => {
    Alert.alert('Quick Chat', 'Starting quick chat');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#EBF4FF', '#F8FAFC']}
        style={styles.backgroundGradient}
      />
      
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <Header 
          unreadCount={getUnreadCount()}
          onNotificationPress={handleNotificationPress}
          onProfilePress={handleProfilePress}
        />
        
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
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
        
        <FloatingChatButton 
          onPress={handleFloatingChatPress}
        />
      </Animated.View>
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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for floating button
  },
});

export default Communication;
