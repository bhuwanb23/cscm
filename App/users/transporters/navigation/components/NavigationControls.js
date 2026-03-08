import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';

const NavigationControls = () => {
  const handleStartNavigation = () => {
    Alert.alert('Navigation', 'Starting turn-by-turn navigation');
  };

  const handleMuteUnmute = () => {
    console.log('Toggle voice guidance');
  };

  const handleOverview = () => {
    Alert.alert('Route Overview', 'Showing full route overview');
  };

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.controlButton, styles.startButton]} 
            onPress={handleStartNavigation}
          >
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.controlButtonText}>Start</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.muteButton]} 
            onPress={handleMuteUnmute}
          >
            <Ionicons name="volume-high" size={20} color="#2563EB" />
            <Text style={[styles.controlButtonText, styles.muteButtonText]}>Sound</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.controlButton, styles.overviewButton]} 
            onPress={handleOverview}
          >
            <Ionicons name="eye-outline" size={20} color="#2563EB" />
            <Text style={[styles.controlButtonText, styles.overviewButtonText]}>Overview</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 0,
  },
  controlsRow: {
    flexDirection: 'row',
    padding: 12,
  },
  controlButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startButton: {
    backgroundColor: '#2563EB',
    marginRight: 8,
  },
  muteButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    marginRight: 8,
  },
  overviewButton: {
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  muteButtonText: {
    color: '#2563EB',
  },
  overviewButtonText: {
    color: '#2563EB',
  },
});

export default NavigationControls;
