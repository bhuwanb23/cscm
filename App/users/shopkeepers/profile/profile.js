import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

// Components
import ProfileHeader from './components/ProfileHeader';
import BusinessInfo from './components/BusinessInfo';
import ChannelsWarehouses from './components/ChannelsWarehouses';
import SettingsSection from './components/SettingsSection';

// Hooks
import { useProfileData } from './hooks/useProfileData';

const ShopkeeperDashboard = ({ onLogout }) => {
  const {
    businessInfo,
    channels,
    warehouses,
    stats,
    shopInfo,
    updateBusinessInfo,
  } = useProfileData();

  const [isEditing, setIsEditing] = useState(false);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleSave = (updatedInfo) => {
    updateBusinessInfo(updatedInfo);
    setIsEditing(false);
    Alert.alert('Success', 'Profile updated successfully!');
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: onLogout },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ProfileHeader
          shopInfo={shopInfo}
          stats={stats}
          onEditProfile={handleEditProfile}
        />

        <BusinessInfo
          businessInfo={businessInfo}
          onEdit={handleEditProfile}
          isEditing={isEditing}
          onSave={handleSave}
          onCancel={handleCancel}
        />

        <ChannelsWarehouses
          channels={channels}
          warehouses={warehouses}
        />

        <SettingsSection onLogout={handleLogout} />
      </ScrollView>

      {/* Action Buttons - only show when not editing (BusinessInfo has its own) */}
      {!isEditing && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  logoutButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#dc2626',
  },
});

export default ShopkeeperDashboard;
