import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { TRANSPORTER_DEFAULT_STOPS } from '../../../../src/demo';

const RouteDetails = ({ stops }) => {
  const routeStops = stops && stops.length > 0 ? stops : TRANSPORTER_DEFAULT_STOPS;

  const getStatusIcon = (status) => {
    if (status === 'completed') return 'checkmark-circle';
    if (status === 'current') return 'location';
    return 'ellipse-outline';
  };

  const getStatusColor = (status) => {
    if (status === 'completed') return '#10B981';
    if (status === 'current') return '#2563EB';
    return '#9CA3AF';
  };

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="list-outline" size={20} color="#2563EB" />
            <Text style={styles.sectionTitle}>Route Stops</Text>
          </View>
          <Text style={styles.totalStops}>{routeStops.length} Stops</Text>
        </View>
        <View style={styles.stopsList}>
          {routeStops.map((stop, index) => (
            <View key={stop.id} style={styles.stopItem}>
              <View style={styles.stopIconContainer}>
                <Ionicons name={getStatusIcon(stop.status)} size={20} color={getStatusColor(stop.status)} />
                {index < routeStops.length - 1 && (<View style={styles.stopConnector} />)}
              </View>
              <View style={styles.stopInfo}>
                <Text style={styles.stopName}>{stop.name}</Text>
                <Text style={styles.stopAddress}>{stop.address}</Text>
              </View>
              <View style={styles.stopStatus}>
                {stop.status === 'current' && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginTop: 12, borderRadius: 12, backgroundColor: '#fff' },
  cardContent: { padding: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginLeft: 8 },
  totalStops: { fontSize: 12, color: '#6B7280', backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  stopsList: { padding: 16 },
  stopItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  stopIconContainer: { alignItems: 'center', marginRight: 12, position: 'relative' },
  stopConnector: { position: 'absolute', top: 24, left: 9, width: 2, height: 40, backgroundColor: '#E5E7EB' },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 2 },
  stopAddress: { fontSize: 12, color: '#6B7280' },
  stopStatus: { marginLeft: 8 },
  currentBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  currentBadgeText: { fontSize: 11, fontWeight: '600', color: '#2563EB' },
});

export default RouteDetails;
