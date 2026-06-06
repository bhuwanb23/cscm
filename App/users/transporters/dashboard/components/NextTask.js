import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const NextTask = ({ data, onStartRoute, onCall }) => {
  const task = data || {
    priority: 'High',
    distance: '2.4 miles away',
    eta: '10:45 AM',
    storeName: 'Whole Foods Market',
    storeAddress: '1200 Broadway, Seattle, WA',
    orderId: '#ORD-9921',
    packages: '15 Boxes',
    weight: '320 lbs',
    type: 'DELIVERY',
  };

  const handleNavigatePress = () => Alert.alert('Navigation', 'Starting navigation to destination');
  const handleCallPress = () => {
    if (onCall) onCall(task);
    else Alert.alert('Call', 'Calling customer');
  };
  const handleStartRoute = () => {
    if (onStartRoute) onStartRoute(task);
    else Alert.alert('Route Started', 'Beginning delivery route');
  };
  const handleViewDetails = () => Alert.alert('Task Details', 'Viewing task details');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Next Task</Text>
        <View style={styles.priorityTag}>
          <Text style={styles.priorityText}>Priority {task.priority}</Text>
        </View>
      </View>

      <Card style={styles.taskCard}>
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }}
          style={styles.mapImage}
          imageStyle={styles.mapImageStyle}
        >
          <View style={styles.mapOverlay} />
          <View style={styles.mapInfo}>
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color="#fff" />
              <Text style={styles.mapText}>{task.distance}</Text>
            </View>
            <Text style={styles.mapTextBold}>ETA: {task.eta}</Text>
          </View>
          <TouchableOpacity style={styles.navigateButton} onPress={handleNavigatePress}>
            <Ionicons name="navigate" size={20} color="#2563EB" />
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.taskDetails}>
          <View style={styles.taskHeader}>
            <View style={styles.taskInfo}>
              <Text style={styles.storeName}>{task.storeName}</Text>
              <Text style={styles.storeAddress}>{task.storeAddress}</Text>
            </View>
            <View style={styles.taskTags}>
              <View style={styles.deliveryTag}>
                <Text style={styles.deliveryText}>{task.type}</Text>
              </View>
              <Text style={styles.orderId}>{task.orderId}</Text>
            </View>
          </View>

          <View style={styles.taskStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Packages</Text>
              <Text style={styles.statValue}>{task.packages}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Weight</Text>
              <Text style={styles.statValue}>{task.weight}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Contact</Text>
              <TouchableOpacity style={styles.callButton} onPress={handleCallPress}>
                <Ionicons name="call-outline" size={16} color="#2563EB" />
                <Text style={styles.callButtonText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <Button mode="contained" style={styles.startButton} onPress={handleStartRoute}>
              Start Route
            </Button>
            <Button mode="outlined" style={styles.detailsButton} onPress={handleViewDetails}>
              Details
            </Button>
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#111827' },
  priorityTag: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityText: { fontSize: 12, fontWeight: '500', color: '#2563EB' },
  taskCard: { borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  mapImage: { height: 120, borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' },
  mapImageStyle: { opacity: 0.8 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.3)' },
  mapInfo: { position: 'absolute', bottom: 12, left: 16 },
  locationInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  mapText: { fontSize: 12, color: '#fff', opacity: 0.9, marginLeft: 4 },
  mapTextBold: { fontSize: 12, fontWeight: '600', color: '#fff' },
  navigateButton: { position: 'absolute', bottom: 12, right: 16, backgroundColor: '#fff', width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 },
  taskDetails: { padding: 16 },
  taskHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  taskInfo: { flex: 1 },
  storeName: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  storeAddress: { fontSize: 14, color: '#6B7280' },
  taskTags: { alignItems: 'flex-end' },
  deliveryTag: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, marginBottom: 4 },
  deliveryText: { fontSize: 10, fontWeight: '700', color: '#2563EB' },
  orderId: { fontSize: 12, color: '#6B7280' },
  taskStats: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderTopWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  statValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  statDivider: { width: 1, height: 32, backgroundColor: '#E5E7EB' },
  callButton: { flexDirection: 'row', alignItems: 'center' },
  callButtonText: { fontSize: 14, fontWeight: '600', color: '#2563EB', marginLeft: 4 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  startButton: { flex: 1, backgroundColor: '#2563EB', borderRadius: 8 },
  detailsButton: { flex: 1, borderRadius: 8, borderColor: '#E5E7EB' },
});

export default NextTask;
