import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

// Components
import ProfileHeader from './components/ProfileHeader';
import BusinessInfo from './components/BusinessInfo';
import ChannelsWarehouses from './components/ChannelsWarehouses';
import SettingsSection from './components/SettingsSection';

// Hooks
import { useProfileData } from './hooks/useProfileData';

const ShopkeeperDashboard = () => {
  const {
    businessInfo,
    channels,
    warehouses,
    stats,
    shopInfo,
    updateBusinessInfo
  } = useProfileData();

  const handleEditProfile = () => {
    Alert.alert('Coming Soon', 'Profile editing will be available in a future update.');
  };

  const handleSave = () => {
    Alert.alert('Coming Soon', 'Save changes will be available in a future update.');
  };

  const handleCancel = () => {
    Alert.alert('Coming Soon', 'Cancel will be available in a future update.');
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
        />
        
        <ChannelsWarehouses 
          channels={channels} 
          warehouses={warehouses} 
        />
        
        <SettingsSection />
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
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
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#4f46e5',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default ShopkeeperDashboard;