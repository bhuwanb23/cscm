import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const RecentActivity = ({ recentActivity }) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Recent Activity</Title>
        {recentActivity.map((activity) => (
          <View key={activity.id} style={styles.activityItem}>
            <View style={styles.activityIcon}>
              <Ionicons 
                name={
                  activity.status === 'Completed' 
                    ? 'checkmark-circle' 
                    : 'time-outline'
                } 
                size={20} 
                color={
                  activity.status === 'Completed' 
                    ? '#6BCF7F' 
                    : '#FFD93D'
                } 
              />
            </View>
            <View style={styles.activityContent}>
              <Text style={styles.activityAction}>{activity.action}</Text>
              <Text style={styles.activityTime}>{activity.time}</Text>
            </View>
            <View style={[
              styles.activityStatus, 
              { 
                backgroundColor: activity.status === 'Completed' 
                  ? '#E6F4EA' 
                  : '#FFF8E6'
              }
            ]}>
              <Text style={[
                styles.activityStatusText,
                { 
                  color: activity.status === 'Completed' 
                    ? '#2E7D32' 
                    : '#FFA000'
                }
              ]}>
                {activity.status}
              </Text>
            </View>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityAction: {
    fontSize: 14,
    color: '#2C3E50',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default RecentActivity;