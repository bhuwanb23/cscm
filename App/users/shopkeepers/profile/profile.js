import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const Profile = ({ onLogout }) => { // Add onLogout prop
  // Mock user data
  const userData = {
    name: 'John Doe',
    email: 'john.doe@store.com',
    phone: '+1 234 567 8900',
    storeName: 'Fresh Market',
    storeId: 'ST-12345',
    address: '123 Main Street, City, State 12345',
    memberSince: 'January 2022',
    totalOrders: 128,
    totalSpent: '$12,450',
    loyaltyPoints: 1250,
  };

  // Mock recent activity data
  const recentActivity = [
    { id: 1, action: 'Stock request submitted', time: '2 hours ago', status: 'Pending' },
    { id: 2, action: 'Shipment received', time: '1 day ago', status: 'Completed' },
    { id: 3, action: 'Inventory updated', time: '2 days ago', status: 'Completed' },
    { id: 4, action: 'Analysis report generated', time: '3 days ago', status: 'Completed' },
  ];

  // Mock settings options
  const settingsOptions = [
    { id: 1, title: 'Account Settings', icon: 'person-outline' },
    { id: 2, title: 'Notification Preferences', icon: 'notifications-outline' },
    { id: 3, title: 'Payment Methods', icon: 'card-outline' },
    { id: 4, title: 'Security', icon: 'lock-closed-outline' },
    { id: 5, title: 'Help & Support', icon: 'help-circle-outline' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={['#F8F9FA', '#E9ECEF']} style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{userData.name.charAt(0)}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userData.name}</Text>
                <Text style={styles.profileEmail}>{userData.email}</Text>
                <View style={styles.storeInfo}>
                  <Ionicons name="storefront-outline" size={16} color="#4A90E2" />
                  <Text style={styles.storeName}>{userData.storeName}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userData.totalOrders}</Text>
              <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userData.loyaltyPoints}</Text>
              <Text style={styles.statLabel}>Loyalty Points</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userData.totalSpent}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>

          {/* Account Details Card */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Account Details</Title>
              <View style={styles.detailRow}>
                <Ionicons name="mail-outline" size={20} color="#4A90E2" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue}>{userData.email}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="call-outline" size={20} color="#4A90E2" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{userData.phone}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={20} color="#4A90E2" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Store Address</Text>
                  <Text style={styles.detailValue}>{userData.address}</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
                <View style={styles.detailTextContainer}>
                  <Text style={styles.detailLabel}>Member Since</Text>
                  <Text style={styles.detailValue}>{userData.memberSince}</Text>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Recent Activity */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Recent Activity</Title>
              {recentActivity.map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <Ionicons 
                      name={
                        activity.status === 'Completed' 
                          ? 'checkmark-circle' 
                          : 'time-outline'
                      } 
                      size={20} 
                      color={
                        activity.status === 'Completed' 
                          ? '#6BCF7F' 
                          : '#FFD93D'
                      } 
                    />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityAction}>{activity.action}</Text>
                    <Text style={styles.activityTime}>{activity.time}</Text>
                  </View>
                  <View style={[
                    styles.activityStatus, 
                    { 
                      backgroundColor: activity.status === 'Completed' 
                        ? '#E6F4EA' 
                        : '#FFF8E6'
                    }
                  ]}>
                    <Text style={[
                      styles.activityStatusText,
                      { 
                        color: activity.status === 'Completed' 
                          ? '#2E7D32' 
                          : '#FFA000'
                      }
                    ]}>
                      {activity.status}
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Settings */}
          <Card style={styles.card}>
            <Card.Content>
              <Title style={styles.cardTitle}>Settings</Title>
              {settingsOptions.map((option) => (
                <TouchableOpacity key={option.id} style={styles.settingItem}>
                  <View style={styles.settingContent}>
                    <Ionicons name={option.icon} size={20} color="#4A90E2" />
                    <Text style={styles.settingText}>{option.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#7F8C8D" />
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '32%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: 8,
  },
});

export default Profile;