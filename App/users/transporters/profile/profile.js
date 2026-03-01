import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

// Components
import ProfileHeader from './components/ProfileHeader';
import DriverInfo from './components/DriverInfo';
import VehicleInfo from './components/VehicleInfo';
import SettingsSection from './components/SettingsSection';

// Hooks
import { useProfileData } from './hooks/useProfileData';

const TransporterProfile = ({ onLogout }) => {
  const {
    driverInfo,
    vehicleInfo,
    stats,
    updateDriverInfo,
    updateVehicleInfo
  } = useProfileData();

  const handleEditProfile = () => {
    console.log('Edit profile pressed');
  };

  const handleSave = () => {
    console.log('Save pressed');
  };

  const handleCancel = () => {
    console.log('Cancel pressed');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ProfileHeader 
          driverInfo={driverInfo} 
          stats={stats} 
          onEditProfile={handleEditProfile} 
        />
        
        <DriverInfo 
          driverInfo={driverInfo} 
          onEdit={handleEditProfile} 
        />
        
        <VehicleInfo 
          vehicleInfo={vehicleInfo} 
          onEdit={handleEditProfile} 
        />
        
        <SettingsSection onLogout={onLogout} />
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
    backgroundColor: '#2563eb',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default TransporterProfile;