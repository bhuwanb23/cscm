import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import Header from './components/Header';
import RouteMap from './components/RouteMap';
import NavigationControls from './components/NavigationControls';
import RouteDetails from './components/RouteDetails';
import UpcomingTurns from './components/UpcomingTurns';
import { useNavigationData } from './hooks/useNavigationData';

const Navigation = ({ onLogout }) => {
  const { routeStops, upcomingTurns, isNavigating, isMuted, startNavigation, stopNavigation, toggleMute, refetch } = useNavigationData();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };

  return (
    <View style={styles.container}>
      <Header title="Navigation" subtitle="Route guidance and directions" onLogout={onLogout} />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" colors={['#3B82F6']} />
        }
      >
        <RouteMap />
        <NavigationControls
          isNavigating={isNavigating}
          isMuted={isMuted}
          onStart={startNavigation}
          onStop={stopNavigation}
          onToggleMute={toggleMute}
        />
        <RouteDetails stops={routeStops} />
        <UpcomingTurns turns={upcomingTurns} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
});

export default Navigation;
