import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const AccountDetails = ({ userData }) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Account Details</Title>
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={20} color="#4A90E2" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Email</Text>
            <Text style={styles.detailValue}>{userData.email}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="call-outline" size={20} color="#4A90E2" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Phone</Text>
            <Text style={styles.detailValue}>{userData.phone}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="location-outline" size={20} color="#4A90E2" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Store Address</Text>
            <Text style={styles.detailValue}>{userData.address}</Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={20} color="#4A90E2" />
          <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>Member Since</Text>
            <Text style={styles.detailValue}>{userData.memberSince}</Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
});

export default AccountDetails;