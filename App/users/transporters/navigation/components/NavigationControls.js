import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const NavigationControls = ({ isNavigating, isMuted, onStart, onStop, onToggleMute }) => {
  const handleStart = () => {
    if (isNavigating) onStop && onStop();
    else onStart && onStart();
  };
  const handleOverview = () => Alert.alert('Route Overview', 'Showing full route overview');

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.controlButton, styles.startButton]}
            onPress={handleStart}
          >
            <LinearGradient
              colors={['#3B82F6', '#1E40AF']}
              style={styles.controlButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={isNavigating ? 'stop' : 'play'} size={20} color="#fff" />
              <Text style={styles.controlButtonText}>{isNavigating ? 'Stop' : 'Start'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.muteButton]}
            onPress={onToggleMute}
          >
            <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={20} color="#2563EB" />
            <Text style={[styles.controlButtonText, styles.muteButtonText]}>{isMuted ? 'Muted' : 'Sound'}</Text>
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
  card: { marginHorizontal: 16, marginTop: 12, borderRadius: 12, backgroundColor: '#fff' },
  cardContent: { padding: 0 },
  controlsRow: { flexDirection: 'row', padding: 12 },
  controlButton: { flex: 1, borderRadius: 8, overflow: 'hidden' },
  controlButtonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 8 },
  startButton: {},
  muteButton: { backgroundColor: 'rgba(37, 99, 235, 0.1)', marginRight: 8 },
  overviewButton: { backgroundColor: 'rgba(37, 99, 235, 0.1)' },
  controlButtonText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  muteButtonText: { color: '#2563EB' },
  overviewButtonText: { color: '#2563EB' },
});

export default NavigationControls;
