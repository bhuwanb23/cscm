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
import { LinearGradient } from 'expo-linear-gradient';

const Header = ({ title, subtitle, onLogout }) => {
  const handleNotificationPress = () => {
    Alert.alert('Notifications', 'Viewing notifications');
  };

  const handleEditPress = () => {
    Alert.alert('Coming Soon', 'Profile editing will be available in a future update.');
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.driverInfo}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-2.jpg' }} 
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>
          <View style={styles.driverText}>
            <Text style={styles.driverName}>Alex Johnson</Text>
            <Text style={styles.truckId}>Driver ID: #DRV-4092</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
          <LinearGradient
            colors={['#3B82F6', '#1E40AF']}
            style={styles.editButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="create" size={18} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  driverText: {
    flexDirection: 'column',
  },
  driverName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  truckId: {
    fontSize: 12,
    color: '#6B7280',
  },
  editButton: {
    padding: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  editButtonGradient: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Header;