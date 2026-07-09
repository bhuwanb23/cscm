import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { TRANSPORTER_UPCOMING_STOPS } from '../../../../src/demo';

const UpcomingStops = ({ data, onStopPress, onSeeAll }) => {
  const stops = data && data.length > 0 ? data : TRANSPORTER_UPCOMING_STOPS;

  const handleStopPress = (stop) => {
    if (onStopPress) onStopPress(stop);
    else Alert.alert('Stop Details', `Viewing details for ${stop.name}`);
  };
  const handleSeeAll = () => {
    if (onSeeAll) onSeeAll();
    else Alert.alert('All Stops', 'Viewing all upcoming stops');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Stops</Text>
        <TouchableOpacity onPress={handleSeeAll}>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.stopsCard}>
        {stops.map((stop, index) => (
          <TouchableOpacity
            key={stop.id || index}
            onPress={() => handleStopPress(stop)}
            style={[styles.stopItem, index !== stops.length - 1 && styles.stopBorder]}
          >
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{stop.time}</Text>
              <Text style={styles.period}>{stop.period}</Text>
            </View>
            <View style={[styles.indicator, stop.completed && styles.completedIndicator]} />
            <View style={styles.stopInfo}>
              <Text style={[styles.stopName, stop.completed && styles.completedText]}>
                {stop.name}
              </Text>
              <Text style={[styles.stopDetails, stop.completed && styles.completedText]}>
                {stop.type} • {stop.details}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#D1D5DB" style={styles.chevron} />
          </TouchableOpacity>
        ))}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  seeAll: { fontSize: 12, fontWeight: '500', color: '#2563EB' },
  stopsCard: { borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  stopItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  stopBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  timeContainer: { alignItems: 'center', minWidth: 40 },
  time: { fontSize: 12, fontWeight: '700', color: '#111827' },
  period: { fontSize: 10, color: '#6B7280' },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#6B7280' },
  completedIndicator: { backgroundColor: '#9CA3AF' },
  stopInfo: { flex: 1 },
  stopName: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 2 },
  stopDetails: { fontSize: 12, color: '#6B7280' },
  completedText: { color: '#9CA3AF' },
  chevron: { marginLeft: 'auto' },
});

export default UpcomingStops;
