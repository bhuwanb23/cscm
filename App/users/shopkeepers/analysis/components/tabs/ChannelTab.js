import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChannelTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Channel Sync & Availability Mesh</Text>
        <Text style={styles.description}>
          Real-time synchronization across all sales channels with intelligent stock allocation
        </Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Channel Intelligence</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="layers" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>D2C vs marketplace stock comparison</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="wifi" size={16} color="#10B981" />
            <Text style={styles.bulletText}>API sync health indicators</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.bulletText}>Fake-stock detection and overselling risk</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="speedometer" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>Quick-commerce readiness score</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ChannelTab;

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  bulletList: {
    gap: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletText: {
    fontSize: 14,
    color: '#4B5563',
    flex: 1,
    lineHeight: 20,
  },
});