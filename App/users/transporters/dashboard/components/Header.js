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
    <>
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
                <Text style={styles.driverName}>Good Morning, Alex</Text>
                <Text style={styles.truckId}>Truck ID: #TR-4092</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationPress}>
              <Ionicons name="notifications-outline" size={24} color="#7F8C8D" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
          
          {/* Shift Status */}
          <View style={styles.shiftStatusContainer}>
            <View style={styles.shiftStatus}>
              <Text style={styles.shiftStatusLabel}>SHIFT STATUS</Text>
              <View style={styles.shiftToggle}>
                <Text style={styles.shiftStatusText}>On Duty</Text>
                <TouchableOpacity style={styles.toggleSwitch}>
                  <View style={styles.switchTrack}>
                    <View style={styles.switchThumb} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#fff',
  },
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
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  shiftStatusContainer: {
    paddingTop: 12,
  },
  shiftStatus: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shiftStatusLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  shiftToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftStatusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  toggleSwitch: {
    width: 36,
    height: 20,
  },
  switchTrack: {
    width: 36,
    height: 20,
    backgroundColor: '#E5E7EB',
    borderRadius: 10,
    justifyContent: 'center',
    padding: 2,
  },
  switchThumb: {
    width: 16,
    height: 16,
    backgroundColor: '#10B981',
    borderRadius: 8,
    alignSelf: 'flex-end',
  },
});

export default Header;