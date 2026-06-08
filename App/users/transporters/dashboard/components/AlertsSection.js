import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TRANSPORTER_ALERTS_SECTION } from '../../../../src/demo';

const AlertsSection = ({ data, onAlertPress }) => {
  const alerts = data && data.length > 0 ? data : TRANSPORTER_ALERTS_SECTION;

  const handleAlertPress = (alert) => {
    if (onAlertPress) onAlertPress(alert);
    else Alert.alert('Alert', `Viewing details for: ${alert.title}`);
  };
  const handleViewDetails = () => Alert.alert('Details', 'Viewing alert details');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Alerts & Updates</Text>
      <View style={styles.alertsList}>
        {alerts.map((alert) => (
          <TouchableOpacity key={alert.id} onPress={() => handleAlertPress(alert)}>
            <View style={[styles.alertItem, alert.type === 'info' && styles.updateItem]}>
              <View style={styles.alertIconContainer}>
                <Ionicons
                  name={alert.type === 'warning' ? 'warning' : 'information-circle'}
                  size={20}
                  color={alert.type === 'warning' ? '#EF4444' : '#2563EB'}
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDescription}>{alert.description}</Text>
                {alert.hasViewDetails && (
                  <TouchableOpacity onPress={handleViewDetails}>
                    <Text style={styles.viewDetails}>View Details</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  alertsList: { gap: 12 },
  alertItem: { backgroundColor: '#FEF2F2', borderLeftWidth: 4, borderLeftColor: '#EF4444', padding: 12, borderTopRightRadius: 8, borderBottomRightRadius: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  updateItem: { backgroundColor: '#EFF6FF', borderLeftColor: '#2563EB' },
  alertIconContainer: { marginTop: 2 },
  alertContent: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  alertDescription: { fontSize: 12, color: '#6B7280' },
  viewDetails: { fontSize: 12, fontWeight: '600', color: '#2563EB', marginTop: 8 },
});

export default AlertsSection;
