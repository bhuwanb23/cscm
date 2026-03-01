import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const DriverInfo = ({ driverInfo, onEdit }) => {
  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="person-circle-outline" size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>Driver Information</Text>
          </View>
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color="#6B7280" 
            style={styles.chevron}
          />
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>License Number</Text>
            <Text style={styles.value}>{driverInfo.licenseNumber}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>License Expiry</Text>
            <Text style={styles.value}>{driverInfo.licenseExpiry}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Phone Number</Text>
            <Text style={styles.value}>{driverInfo.phone}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Emergency Contact</Text>
            <Text style={styles.value}>{driverInfo.emergencyContact}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Years of Experience</Text>
            <Text style={styles.value}>{driverInfo.experience} years</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Preferred Routes</Text>
            <Text style={styles.value}>{driverInfo.preferredRoutes}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  chevron: {
    marginLeft: 8,
  },
  infoGrid: {
    padding: 16,
  },
  infoItem: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '400',
  },
});

export default DriverInfo;