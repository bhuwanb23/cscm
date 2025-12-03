import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const UpcomingStops = () => {
  const stops = [
    {
      time: '11:30',
      period: 'AM',
      name: 'Starbucks Reserve',
      type: 'Delivery',
      details: '3 Boxes',
      completed: false,
    },
    {
      time: '12:15',
      period: 'PM',
      name: 'Amazon Hub Locker',
      type: 'Pickup',
      details: '12 Packages',
      completed: false,
    },
    {
      time: '01:45',
      period: 'PM',
      name: 'Best Buy Warehouse',
      type: 'Delivery',
      details: 'Pallet',
      completed: true,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Stops</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.stopsCard}>
        {stops.map((stop, index) => (
          <View 
            key={index} 
            style={[
              styles.stopItem, 
              index !== stops.length - 1 && styles.stopBorder
            ]}
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
            
            <Ionicons 
              name="chevron-forward" 
              size={16} 
              color="#D1D5DB" 
              style={styles.chevron} 
            />
          </View>
        ))}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
  stopsCard: {
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  stopBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  timeContainer: {
    alignItems: 'center',
    minWidth: 40,
  },
  time: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  period: {
    fontSize: 10,
    color: '#6B7280',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6B7280',
  },
  completedIndicator: {
    backgroundColor: '#9CA3AF',
  },
  stopInfo: {
    flex: 1,
  },
  stopName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  stopDetails: {
    fontSize: 12,
    color: '#6B7280',
  },
  completedText: {
    color: '#9CA3AF',
  },
  chevron: {
    marginLeft: 'auto',
  },
});

export default UpcomingStops;