import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { PROFILE_CONSTANTS } from '../constants/profileConstants';

const Settings = () => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <Title style={styles.cardTitle}>Settings</Title>
        {PROFILE_CONSTANTS.SETTINGS_OPTIONS.map((option) => (
          <TouchableOpacity key={option.id} style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Ionicons name={option.icon} size={20} color="#4A90E2" />
              <Text style={styles.settingText}>{option.title}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#7F8C8D" />
          </TouchableOpacity>
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#2C3E50',
    marginLeft: 12,
  },
});

export default Settings;