import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { PROFILE_CONSTANTS } from '../constants';

const SettingsSection = ({ onLogout }) => {
  const handleSettingPress = (setting) => {
    Alert.alert('Coming Soon', `${setting.title} will be available in a future update.`);
  };

  return (
    <Card style={styles.card} elevation={2}>
      <Card.Content style={styles.cardContent}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingsList}>
          {PROFILE_CONSTANTS.SETTINGS_OPTIONS.map((setting, index) => (
            <TouchableOpacity
              key={setting.id}
              style={[styles.settingItem, index !== PROFILE_CONSTANTS.SETTINGS_OPTIONS.length - 1 && styles.settingBorder]}
              onPress={() => handleSettingPress(setting)}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconContainer, { backgroundColor: `${setting.iconColor}20` }]}>
                  <Ionicons name={setting.icon} size={20} color={setting.iconColor} />
                </View>
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>{setting.title}</Text>
                  <Text style={styles.settingSubtitle}>{setting.subtitle}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <View style={styles.logoutContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#EF444420' }]}>
              <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  cardContent: {
    padding: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    padding: 16,
    paddingBottom: 8,
  },
  settingsList: {
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginTop: 8,
  },
  logoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 12,
  },
});

export default SettingsSection;