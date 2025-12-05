import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const Header = ({ title, subtitle, onLogout }) => {
  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'Viewing notifications');
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.profileContainer}>
            <View style={styles.notificationBadge}>
              <Text style={styles.badgeText}>2</Text>
            </View>
            <TouchableOpacity onPress={handleNotificationPress} style={styles.profileButton}>
              <Image 
                source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg' }} 
                style={styles.profileImage} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    backgroundColor: '#FFFFFF',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  profileContainer: {
    position: 'relative',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
});

export default Header;