import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TwinsTab = () => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Digital Twin Explorer (Preview)</Text>
        <Text style={styles.description}>
          What-if scenario simulations and predictive modeling for supply chain optimization
        </Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Example Simulations</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="analytics" size={16} color="#3B82F6" />
            <Text style={styles.bulletText}>If we increase production by 20%, which nodes saturate first?</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="storefront" size={16} color="#8B5CF6" />
            <Text style={styles.bulletText}>If Store A closes for 5 days, what is the revenue and service-level impact?</Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="trending-up" size={16} color="#F59E0B" />
            <Text style={styles.bulletText}>If we get a 2x weekend spike, which SKUs/regions break first?</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default TwinsTab;

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