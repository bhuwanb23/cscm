import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Header from './components/Header';
import SearchFilters from './components/SearchFilters';
import StatusLegend from './components/StatusLegend';
import TaskList from './components/TaskList';
import { useTasksData } from './hooks/useTasksData';

const Tasks = ({ onLogout }) => {
  const {
    tasks,
    counts,
    searchQuery,
    activeFilter,
    setSearchQuery,
    setActiveFilter,
    handleTaskPress,
    refetch,
    loading,
  } = useTasksData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };

  const subtitle = counts.all > 0
    ? `${counts.all} Tasks • ${counts.inProgress + counts.pending} Active`
    : 'Tuesday, Oct 24 • 5 Tasks Remaining';

  return (
    <View style={styles.container}>
      <Header title="My Tasks" subtitle={subtitle} onLogout={onLogout} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        <SearchFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={counts}
        />
        <StatusLegend />
        <View style={styles.taskListContainer}>
          <TaskList tasks={tasks} onTaskPress={handleTaskPress} />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  taskListContainer: { paddingBottom: 24 },
});

export default Tasks;
