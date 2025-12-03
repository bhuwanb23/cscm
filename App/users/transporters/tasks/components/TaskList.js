import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import TaskCard from './TaskCard';

const TaskList = () => {
  // Sample task data - in a real app this would come from an API
  const tasks = [
    {
      id: '1',
      status: 'inProgress',
      priority: 'high',
      orderId: '#CSCM-8921',
      eta: '14 min',
      pickup: {
        time: '09:30 AM',
        location: 'Warehouse A, Zone 4',
        completed: true
      },
      delivery: {
        time: '10:45 AM - 11:15 AM',
        location: 'TechSolutions HQ, 4500 Innovation Dr.',
        city: 'San Francisco, CA 94103',
        completed: false
      },
      packages: 5,
      specialHandling: null
    },
    {
      id: '2',
      status: 'pending',
      priority: 'normal',
      orderId: '#CSCM-9004',
      window: '12:00 PM',
      origin: {
        location: 'Central Logistics Hub, Gate 4',
        specialHandling: 'Fragile'
      },
      dueIn: '2h 15m'
    },
    {
      id: '3',
      status: 'scheduled',
      priority: 'normal',
      orderId: '#CSCM-9155',
      window: '02:30 PM',
      destination: {
        location: 'Green Valley Market',
        notes: 'Rear entrance delivery only'
      },
      tags: ['Cold Chain', 'Signature']
    },
    {
      id: '4',
      status: 'completed',
      priority: 'normal',
      orderId: '#CSCM-8810',
      completedTime: '08:45 AM',
      deliveredTo: 'Reception'
    }
  ];

  return (
    <View style={styles.container}>
      {tasks.map((task) => (
        <View key={task.id} style={styles.taskCardWrapper}>
          <TaskCard task={task} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  taskCardWrapper: {
    marginBottom: 16,
  },
});

export default TaskList;