import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';

const StatusLegend = () => {
  const statuses = [
    { id: 'inProgress', label: 'In Progress', color: '#2563EB' },
    { id: 'pending', label: 'Pending', color: '#F59E0B' },
    { id: 'completed', label: 'Completed', color: '#10B981' },
    { id: 'priority', label: 'Priority', color: '#EF4444' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {statuses.map((status) => (
          <View key={status.id} style={styles.statusItem}>
            <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />
            <Text style={styles.statusText}>{status.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    flexShrink: 0,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default StatusLegend;