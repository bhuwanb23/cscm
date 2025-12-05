import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const AlertsSection = () => {
  const handleAlertPress = (alertType) => {
    Alert.alert('Alert', `Viewing details for: ${alertType}`);
  };

  const handleViewDetails = () => {
    Alert.alert('Details', 'Viewing alert details');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alerts & Updates</Text>
      <View style={styles.alertsList}>
        {/* Alert Item */}
        <TouchableOpacity onPress={() => handleAlertPress('Traffic Delay')}>
          <View style={styles.alertItem}>
            <View style={styles.alertIconContainer}>
              <Ionicons name="warning" size={20} color="#EF4444" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>Traffic Delay Detected</Text>
              <Text style={styles.alertDescription}>
                Estimated +15 mins on I-5 South. Rerouting recommended.
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Update Item */}
        <TouchableOpacity onPress={() => handleAlertPress('New Pickup')}>
          <View style={[styles.alertItem, styles.updateItem]}>
            <View style={[styles.alertIconContainer, styles.updateIconContainer]}>
              <Ionicons name="information-circle" size={20} color="#2563EB" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>New Pickup Added</Text>
              <Text style={styles.alertDescription}>
                Stop added to route: TechHub Logistics (Order #993)
              </Text>
              <TouchableOpacity onPress={handleViewDetails}>
                <Text style={styles.viewDetails}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  alertsList: {
    gap: 12,
  },
  alertItem: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    padding: 12,
    borderRadius: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  updateItem: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#2563EB',
  },
  alertIconContainer: {
    marginTop: 2,
  },
  updateIconContainer: {
    // Color is handled by the icon itself
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewDetails: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    marginTop: 8,
  },
});

export default AlertsSection;