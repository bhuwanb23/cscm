import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Card, Title, Paragraph, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../../components/Header';

const ShopkeeperDashboard = ({ onLogout }) => {
  const inventoryData = [
    { item: 'Milk', quantity: 15, status: 'low', color: '#FF6B6B' },
    { item: 'Bread', quantity: 45, status: 'medium', color: '#FFD93D' },
    { item: 'Eggs', quantity: 120, status: 'high', color: '#6BCF7F' },
    { item: 'Rice', quantity: 8, status: 'low', color: '#FF6B6B' },
  ];

  const pendingShipments = [
    { id: 'SH001', items: 'Milk, Bread', eta: '2 hours', status: 'In Transit' },
    { id: 'SH002', items: 'Eggs, Rice', eta: '4 hours', status: 'Dispatched' },
  ];

  const quickActions = [
    { title: 'Request Stock', icon: 'add-circle', color: '#4A90E2' },
    { title: 'Scan Delivery', icon: 'qr-code', color: '#6BCF7F' },
    { title: 'View Inventory', icon: 'list', color: '#FFD93D' },
    { title: 'Track Shipments', icon: 'car', color: '#FF6B6B' },
  ];

  return (
    <LinearGradient colors={['#F8F9FA', '#E9ECEF']} style={styles.container}>
      <Header 
        title="Shopkeeper Dashboard" 
        subtitle="Store Management" 
        onLogout={onLogout}
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

        {/* Inventory Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
          <Card style={styles.card}>
            <Card.Content>
              {inventoryData.map((item, index) => (
                <View key={index} style={styles.inventoryItem}>
                  <View style={styles.inventoryInfo}>
                    <Text style={styles.inventoryName}>{item.item}</Text>
                    <Text style={styles.inventoryQuantity}>{item.quantity} units</Text>
                  </View>
                  <View style={[styles.statusIndicator, { backgroundColor: item.color }]} />
                </View>
              ))}
            </Card.Content>
          </Card>
        </View>

        {/* Pending Shipments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Shipments</Text>
          {pendingShipments.map((shipment, index) => (
            <Card key={index} style={styles.shipmentCard}>
              <Card.Content>
                <View style={styles.shipmentHeader}>
                  <Text style={styles.shipmentId}>#{shipment.id}</Text>
                  <Text style={styles.shipmentStatus}>{shipment.status}</Text>
                </View>
                <Text style={styles.shipmentItems}>{shipment.items}</Text>
                <Text style={styles.shipmentEta}>ETA: {shipment.eta}</Text>
                <Button mode="outlined" style={styles.trackButton}>
                  Track Shipment
                </Button>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerts</Text>
          <Card style={[styles.card, styles.alertCard]}>
            <Card.Content>
              <View style={styles.alertItem}>
                <Ionicons name="warning" size={20} color="#FF6B6B" />
                <Text style={styles.alertText}>Low stock alert: Milk and Rice</Text>
              </View>
              <View style={styles.alertItem}>
                <Ionicons name="information-circle" size={20} color="#4A90E2" />
                <Text style={styles.alertText}>New delivery scheduled for tomorrow</Text>
              </View>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
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
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inventoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  inventoryInfo: {
    flex: 1,
  },
  inventoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  inventoryQuantity: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  shipmentCard: {
    marginBottom: 12,
  },
  shipmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shipmentId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  shipmentStatus: {
    fontSize: 12,
    color: '#4A90E2',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  shipmentItems: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  shipmentEta: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 12,
  },
  trackButton: {
    borderColor: '#4A90E2',
  },
  alertCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
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

export default ShopkeeperDashboard;
