import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const RouteMap = () => {
  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.mapPlaceholder}>
          <LinearGradient
            colors={['#DBEAFE', '#BFDBFE']}
            style={styles.mapGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="map" size={48} color="#3B82F6" />
            <Text style={styles.mapText}>Interactive Map View</Text>
            <Text style={styles.mapSubtext}>GPS navigation would be displayed here</Text>
            
            <View style={styles.routeInfo}>
              <View style={styles.infoItem}>
                <LinearGradient
                  colors={['#3B82F6', '#1E40AF']}
                  style={styles.infoIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="navigate" size={16} color="#fff" />
                </LinearGradient>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>12.5 km</Text>
              </View>
              
              <View style={styles.infoDivider} />
              
              <View style={styles.infoItem}>
                <LinearGradient
                  colors={['#F59E0B', '#D97706']}
                  style={styles.infoIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="time" size={16} color="#fff" />
                </LinearGradient>
                <Text style={styles.infoLabel}>Est. Time</Text>
                <Text style={styles.infoValue}>28 min</Text>
              </View>
              
              <View style={styles.infoDivider} />
              
              <View style={styles.infoItem}>
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.infoIconContainer}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name="stopwatch" size={16} color="#fff" />
                </LinearGradient>
                <Text style={styles.infoLabel}>Arrival</Text>
                <Text style={styles.infoValue}>2:45 PM</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 0,
  },
  mapPlaceholder: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  mapGradient: {
    width: '100%',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  routeInfo: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  infoLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
});

export default RouteMap;
