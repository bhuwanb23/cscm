import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from './components/Header';
import BottomNavbar from './components/BottomNavbar';

const TransporterDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const currentDeliveries = [
    {
      id: 'DEL001',
      store: 'SuperMart Downtown',
      address: '123 Main St, Downtown',
      items: 'Milk, Bread, Eggs',
      status: 'In Transit',
      eta: '15 mins',
      distance: '2.3 km',
    },
    {
      id: 'DEL002',
      store: 'Quick Stop Mall',
      address: '456 Oak Ave, Mall District',
      items: 'Rice, Vegetables',
      status: 'Dispatched',
      eta: '45 mins',
      distance: '5.7 km',
    },
  ];

  const completedDeliveries = [
    { id: 'DEL003', store: 'Corner Store', time: '2:30 PM', status: 'Delivered' },
    { id: 'DEL004', store: 'Market Place', time: '1:15 PM', status: 'Delivered' },
  ];

  const quickActions = [
    { title: 'Start Route', icon: 'play-circle', color: '#6BCF7F' },
    { title: 'Scan Package', icon: 'qr-code', color: '#4A90E2' },
    { title: 'Update Status', icon: 'checkmark-circle', color: '#FFD93D' },
    { title: 'View Map', icon: 'map', color: '#FF6B6B' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Transit': return '#4A90E2';
      case 'Dispatched': return '#FFD93D';
      case 'Delivered': return '#6BCF7F';
      default: return '#7F8C8D';
    }
  };

  const handleTabPress = (tabId) => {
    setActiveTab(tabId);
    // Navigation logic would go here
  };

  const handleProfilePress = () => {
    // Profile navigation logic would go here
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <LinearGradient colors={['#F8F9FA', '#E9ECEF']} style={styles.container}>
        <Header 
          title="Transporter Dashboard" 
          subtitle="Delivery Management" 
          onLogout={onLogout}
          onProfilePress={handleProfilePress}
        />
        <ScrollView style={styles.scrollView}>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity key={index} style={styles.quickActionCard}>
                <Ionicons name={action.icon} size={24} color={action.color} />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Current Deliveries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Deliveries</Text>
          {currentDeliveries.map((delivery, index) => (
            <Card key={index} style={styles.deliveryCard}>
              <Card.Content>
                <View style={styles.deliveryHeader}>
                  <Text style={styles.deliveryId}>#{delivery.id}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
                    <Text style={styles.statusText}>{delivery.status}</Text>
                  </View>
                </View>
                
                <Text style={styles.storeName}>{delivery.store}</Text>
                <Text style={styles.storeAddress}>{delivery.address}</Text>
                
                <View style={styles.deliveryInfo}>
                  <View style={styles.infoItem}>
                    <Ionicons name="cube" size={16} color="#7F8C8D" />
                    <Text style={styles.infoText}>{delivery.items}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="time" size={16} color="#7F8C8D" />
                    <Text style={styles.infoText}>ETA: {delivery.eta}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons name="location" size={16} color="#7F8C8D" />
                    <Text style={styles.infoText}>{delivery.distance}</Text>
                  </View>
                </View>

                <View style={styles.deliveryActions}>
                  <Button mode="outlined" style={styles.actionButton}>
                    Navigate
                  </Button>
                  <Button mode="contained" style={styles.actionButton}>
                    Update Status
                  </Button>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Completed Deliveries */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Deliveries</Text>
          {completedDeliveries.map((delivery, index) => (
            <Card key={index} style={styles.completedCard}>
              <Card.Content>
                <View style={styles.completedHeader}>
                  <Text style={styles.completedId}>#{delivery.id}</Text>
                  <Text style={styles.completedTime}>{delivery.time}</Text>
                </View>
                <Text style={styles.completedStore}>{delivery.store}</Text>
                <View style={styles.completedStatus}>
                  <Ionicons name="checkmark-circle" size={16} color="#6BCF7F" />
                  <Text style={styles.completedStatusText}>{delivery.status}</Text>
                </View>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Performance Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Performance</Text>
          <Card style={styles.statsCard}>
            <Card.Content>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>8</Text>
                  <Text style={styles.statLabel}>Deliveries</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>45</Text>
                  <Text style={styles.statLabel}>KM Driven</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>95%</Text>
                  <Text style={styles.statLabel}>On Time</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerts</Text>
          <Card style={[styles.card, styles.alertCard]}>
            <Card.Content>
              <View style={styles.alertItem}>
                <Ionicons name="information-circle" size={20} color="#4A90E2" />
                <Text style={styles.alertText}>Traffic alert: Heavy congestion on Main St</Text>
              </View>
              <View style={styles.alertItem}>
                <Ionicons name="warning" size={20} color="#FFD93D" />
                <Text style={styles.alertText}>Delivery #DEL001 is running 10 mins late</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
        </ScrollView>
        <BottomNavbar activeTab={activeTab} onTabPress={handleTabPress} />
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: '#2C3E50',
    textAlign: 'center',
  },
  deliveryCard: {
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 12,
  },
  deliveryInfo: {
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#7F8C8D',
  },
  deliveryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  completedCard: {
    marginBottom: 8,
    backgroundColor: '#F8F9FA',
  },
  completedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  completedId: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2C3E50',
  },
  completedTime: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  completedStore: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 4,
  },
  completedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedStatusText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6BCF7F',
    fontWeight: '500',
  },
  statsCard: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#2C3E50',
    flex: 1,
  },
});

export default TransporterDashboard;
