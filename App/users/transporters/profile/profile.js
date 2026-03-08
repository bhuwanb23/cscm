import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  } = useProfileData();

  const handleEditProfile = () => {
    console.log('Edit profile pressed');
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
          onEdit={handleEditProfile} 
        />
        
        <VehicleInfo 
          vehicleInfo={vehicleInfo} 
          onEdit={handleEditProfile} 
        />
        
        <SettingsSection onLogout={onLogout} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
});

export default Profile;