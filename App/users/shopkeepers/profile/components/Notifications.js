import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY } from '../constants/shopkeeperConstants';

const Notification = ({ notification, onDismiss }) => {
  const handleDismiss = () => {
    if (onDismiss) {
      onDismiss(notification.id);
    }
  };

  return (
    <Animated.View style={styles.notificationContainer}>
      <View style={[
        styles.notification, 
        { 
          backgroundColor: 
            notification.type === 'success' ? COLORS.successLight : 
            notification.type === 'warning' ? COLORS.warningLight : 
            notification.type === 'error' ? COLORS.dangerLight : 
            COLORS.slateLight 
        }
      ]}>
        <View style={styles.notificationContent}>
          <Ionicons 
            name={
              notification.type === 'success' ? 'checkmark-circle' : 
              notification.type === 'warning' ? 'warning' : 
              notification.type === 'error' ? 'close-circle' : 
              'information-circle'
            } 
            size={20} 
            color={
              notification.type === 'success' ? COLORS.success : 
              notification.type === 'warning' ? COLORS.warning : 
              notification.type === 'error' ? COLORS.danger : 
              COLORS.indigo
            } 
          />
          <Text style={styles.notificationMessage}>{notification.message}</Text>
        </View>
        <Ionicons 
          name="close" 
          size={20} 
          color={COLORS.slateDark} 
          onPress={handleDismiss}
          style={styles.dismissButton}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  notification: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationMessage: {
    ...TYPOGRAPHY.body,
    marginLeft: 12,
    flex: 1,
  },
  dismissButton: {
    padding: 4,
  },
});

export default Notification;