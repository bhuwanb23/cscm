import { useState, useEffect } from 'react';

export const useProfileData = () => {
  const [driverInfo, setDriverInfo] = useState({
    name: 'John Smith',
    driverId: 'DRV001',
    email: 'john.smith@transporter.com',
    licenseNumber: 'DL1234567890',
    licenseExpiry: '2025-12-31',
    phone: '+1 (555) 123-4567',
    emergencyContact: '+1 (555) 987-6543',
    experience: 5,
    preferredRoutes: 'City Center, Downtown'
  });

  const [vehicleInfo, setVehicleInfo] = useState({
    type: 'Delivery Van',
    registration: 'ABC-123-XYZ',
    capacity: '1.5 tons',
    lastService: '2024-09-15',
    nextService: '2025-03-15',
    insuranceExpiry: '2025-06-30'
  });

  const [stats, setStats] = useState({
    completedDeliveries: 127,
    onTimeRate: 96,
    rating: 4.8
  });

  const updateDriverInfo = (newInfo) => {
    setDriverInfo(prev => ({ ...prev, ...newInfo }));
  };

  const updateVehicleInfo = (newInfo) => {
    setVehicleInfo(prev => ({ ...prev, ...newInfo }));
  };

  return {
    driverInfo,
    vehicleInfo,
    stats,
    updateDriverInfo,
    updateVehicleInfo
  };
};