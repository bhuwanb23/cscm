import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Header from './components/Header';
import RouteMap from './components/RouteMap';
import NavigationControls from './components/NavigationControls';
import RouteDetails from './components/RouteDetails';
import UpcomingTurns from './components/UpcomingTurns';

const Navigation = ({ onLogout }) => {
  return (
    <View style={styles.container}>
      <Header 
        title="Navigation" 
        subtitle="Route guidance and directions" 
        onLogout={onLogout}
      />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <RouteMap />
        <NavigationControls />
        <RouteDetails />
        <UpcomingTurns />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
});

export default Navigation;
