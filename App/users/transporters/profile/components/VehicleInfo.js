import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const VehicleInfo = ({ vehicleInfo, onEdit }) => {
  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="car-outline" size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>Vehicle Information</Text>
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
            <Text style={styles.label}>Vehicle Type</Text>
            <Text style={styles.value}>{vehicleInfo.type}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Registration Number</Text>
            <Text style={styles.value}>{vehicleInfo.registration}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Capacity</Text>
            <Text style={styles.value}>{vehicleInfo.capacity}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Last Service</Text>
            <Text style={styles.value}>{vehicleInfo.lastService}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Next Service Due</Text>
            <Text style={styles.value}>{vehicleInfo.nextService}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.label}>Insurance Expiry</Text>
            <Text style={styles.value}>{vehicleInfo.insuranceExpiry}</Text>
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

export default VehicleInfo;