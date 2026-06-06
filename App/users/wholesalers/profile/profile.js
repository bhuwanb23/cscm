import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { useProfileData } from './hooks/useProfileData';

const Profile = ({ onLogout }) => {
  const { business, stats } = useProfileData();

  return (
    <View style={styles.container}>
      <Header title="Profile" subtitle="Wholesaler account" onLogout={onLogout} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View style={styles.avatar}><Ionicons name="business" size={32} color="#3B82F6" /></View>
            <Text style={styles.businessName}>{business.businessName}</Text>
            <Text style={styles.contactPerson}>{business.contactPerson}</Text>
            <Text style={styles.email}>{business.email}</Text>
          </View>
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalRetailers}</Text>
            <Text style={styles.statLabel}>Retailers</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.monthlyOrders}</Text>
            <Text style={styles.statLabel}>Monthly Orders</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.fulfillmentRate}%</Text>
            <Text style={styles.statLabel}>Fulfillment</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{stats.avgDeliveryTime}</Text>
            <Text style={styles.statLabel}>Avg Delivery</Text>
          </Card>
        </View>

        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Business Information</Text>
          <InfoRow icon="call" label="Phone" value={business.phone} />
          <InfoRow icon="location" label="Address" value={business.address} />
          <InfoRow icon="document-text" label="GSTIN" value={business.gstin} />
          <InfoRow icon="card" label="PAN" value={business.pan} />
          <InfoRow icon="calendar" label="Years in Business" value={`${business.yearsInBusiness} years`} />
        </Card>
      </ScrollView>
    </View>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={18} color="#3B82F6" style={styles.infoIcon} />
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  headerCard: { borderRadius: 16, padding: 20, marginBottom: 16, alignItems: 'center', elevation: 2 },
  headerContent: { alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  businessName: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center' },
  contactPerson: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  email: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statCard: { flexBasis: '48%', flexGrow: 1, padding: 12, alignItems: 'center', borderRadius: 12, elevation: 1 },
  statValue: { fontSize: 18, fontWeight: '700', color: '#3B82F6' },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 2, textTransform: 'uppercase' },
  infoCard: { borderRadius: 12, padding: 16, elevation: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon: { marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#6B7280', textTransform: 'uppercase' },
  infoValue: { fontSize: 13, color: '#111827', fontWeight: '500', marginTop: 2 },
});

export default Profile;
