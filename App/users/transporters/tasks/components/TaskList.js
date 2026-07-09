import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import TaskCard from './TaskCard';

const TaskList = ({ tasks, onTaskPress }) => {
  const list = tasks || [];
  return (
    <View style={styles.container}>
      {list.map((task) => (
        <View key={task.id} style={styles.taskCardWrapper}>
          <TaskCard task={task} onPress={() => onTaskPress && onTaskPress(task)} />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 8 },
  taskCardWrapper: { marginBottom: 16 },
});

export default TaskList;
