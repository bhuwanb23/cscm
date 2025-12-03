import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from './components/Header';
import SearchFilters from './components/SearchFilters';
import StatusLegend from './components/StatusLegend';
import TaskList from './components/TaskList';

const Tasks = ({ onLogout }) => {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Header 
          title="My Tasks" 
          subtitle="Tuesday, Oct 24 • 5 Tasks Remaining" 
          onLogout={onLogout}
        />
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <SearchFilters />
          <StatusLegend />
          <View style={styles.taskListContainer}>
            <TaskList />
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  taskListContainer: {
    paddingBottom: 24,
  },
});

export default Tasks;