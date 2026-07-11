import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import Header from './components/Header';
import DriverInfo from './components/DriverInfo';
import VehicleInfo from './components/VehicleInfo';
import SettingsSection from './components/SettingsSection';
import { useProfileData } from './hooks/useProfileData';

const Profile = ({ onLogout }) => {
  const {
    driverInfo,
    vehicleInfo,
    stats,
    updateDriverInfo,
    updateVehicleInfo,
  } = useProfileData();

  const [isEditingDriver, setIsEditingDriver] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);

  const handleEditDriver = () => {
    setIsEditingDriver(true);
  };

  const handleSaveDriver = (updatedInfo) => {
    updateDriverInfo(updatedInfo);
    setIsEditingDriver(false);
    Alert.alert('Success', 'Driver info updated successfully!');
  };

  const handleCancelDriver = () => {
    setIsEditingDriver(false);
  };

  const handleEditVehicle = () => {
    setIsEditingVehicle(true);
  };

  const handleSaveVehicle = (updatedInfo) => {
    updateVehicleInfo(updatedInfo);
    setIsEditingVehicle(false);
    Alert.alert('Success', 'Vehicle info updated successfully!');
  };

  const handleCancelVehicle = () => {
    setIsEditingVehicle(false);
  };

  return (
    <View style={styles.container}>
      <Header
        title="My Profile"
        subtitle="Manage your account"
        onLogout={onLogout}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <DriverInfo
          driverInfo={driverInfo}
          onEdit={handleEditDriver}
          isEditing={isEditingDriver}
          onSave={handleSaveDriver}
          onCancel={handleCancelDriver}
        />

        <VehicleInfo
          vehicleInfo={vehicleInfo}
          onEdit={handleEditVehicle}
          isEditing={isEditingVehicle}
          onSave={handleSaveVehicle}
          onCancel={handleCancelVehicle}
        />

        <SettingsSection onLogout={onLogout} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
});

export default Profile;
