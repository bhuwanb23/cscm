import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from 'react-native-paper';
import { TRANSPORTER_ROUTE_PROGRESS } from '../../../../src/demo';

const RouteProgress = ({ data }) => {
  const progress = data || TRANSPORTER_ROUTE_PROGRESS;
  const pct = Math.min(100, Math.round((progress.completed / Math.max(progress.total, 1)) * 100));

  const handleRoutePress = () => Alert.alert('Route Details', 'Viewing route completion details');

  return (
    <TouchableOpacity onPress={handleRoutePress}>
      <Card style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Route Completion</Text>
          <Text style={styles.subtitle}>{progress.completed}/{progress.total} Stops</Text>
        </View>

        <View style={styles.chartContainer}>
          <View style={styles.chart}>
            <View style={styles.circleBackground} />
            <View style={styles.circleProgress} />
            <View style={styles.centerText}>
              <Text style={styles.percentage}>{pct}%</Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24, borderRadius: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 12, color: '#6B7280' },
  chartContainer: { alignItems: 'center' },
  chart: { width: 150, height: 150, position: 'relative' },
  circleBackground: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#F3F4F6', position: 'absolute' },
  circleProgress: { width: 150, height: 150, borderRadius: 75, backgroundColor: 'transparent', borderWidth: 20, borderColor: '#2563EB', position: 'absolute', transform: [{ rotate: '45deg' }], borderTopColor: '#2563EB', borderRightColor: '#2563EB', borderBottomColor: 'transparent', borderLeftColor: 'transparent' },
  centerText: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  percentage: { fontSize: 24, fontWeight: '700', color: '#111827' },
});

export default RouteProgress;
